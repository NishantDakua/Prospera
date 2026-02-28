// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChitFundProtocol v4 — P2P Lending Edition
 *
 * Key design:
 * ─────────────────────────────────────────────────────────────────
 * • Admin creates a circle with:
 *     - contributionAmount  (= security deposit = per-round pool deposit)
 *     - maxMembers
 *     - poolType            (Auction | LuckyDraw)
 *     - totalDuration       (seconds) — lifetime of the entire scheme
 *     - biddingWindow       (seconds) — how long bidding/draw is open each round
 *
 * • Round frequency = totalDuration / maxMembers
 *   Each round opens automatically once the previous one settles.
 *
 * • Security deposit collected once on joinGroup (= contributionAmount).
 *   Pool deposit (= contributionAmount) collected each round via contribute().
 *   If a member misses their pool deposit, their security deposit covers it.
 *
 * • Round flow:
 *     1. All active members contribute pool deposit.
 *     2. Bidding/draw window is open for `biddingWindow` seconds.
 *     3. After window closes anyone can call settleRound():
 *        - Auction  → lowest bidder wins their bid amount;
 *                     remainder after 10% fee split equally to all members.
 *        - LuckyDraw→ pseudo-random winner (block hash); full pool minus 10% fee
 *                     credited to winner's withdrawable balance.
 *     4. Winner is flagged hasWon and excluded from future rounds.
 *     5. After all maxMembers rounds complete, scheme ends and
 *        security deposits are credited to withdrawable balances.
 *
 * • P2P LENDING:
 *     - Any enrolled member (trust score ≥ 500, checked off-chain) can request a loan.
 *     - Loan amount = 50% of plan value (contributionAmount × maxMembers).
 *     - Total repayment = 18% interest (10% platform fee + 8% interest).
 *     - Auto-deducted from winnings on round settlement.
 *
 * • PULL-PAYMENT: All payouts (winner, surplus, deposit refunds, loans) are
 *   credited to a withdrawableBalance mapping. Users call withdraw() to collect.
 *   This creates a proper outgoing tx visible in MetaMask.
 * ─────────────────────────────────────────────────────────────────
 */
contract ChitFundProtocol {

    // ================================================================
    // ENUMS & CONSTANTS
    // ================================================================

    enum PoolType { Auction, LuckyDraw }

    uint256 public constant PLATFORM_FEE_PERCENT = 10;
    uint256 public constant LOAN_INTEREST_PERCENT = 8;   // 8% interest to the pool
    uint256 public constant LOAN_PLATFORM_PERCENT = 10;  // 10% platform fee on loan
    // Total repayment = principal + 18% (8% interest + 10% platform fee)

    // ================================================================
    // STORAGE
    // ================================================================

    address public admin;
    uint256 public groupCount;
    uint256 public platformBalance;

    // ── Pull-payment: withdrawable balances ──────────────────────
    mapping(address => uint256) public withdrawableBalance;

    struct Member {
        bool    isActive;
        bool    hasWon;
        bool    hasActiveLoan;
        bool    depositUsed;          // security deposit consumed to cover a missed payment
        uint256 totalContributed;
        uint256 securityDeposit;
        uint256 loanAmount;
        uint256 loanInterest;
        bool    contributedThisRound; // reset each round
    }

    struct Group {
        PoolType poolType;
        uint256  contributionAmount;  // = security deposit = per-round pool deposit
        uint256  maxMembers;
        uint256  currentRound;        // 1-based; increments after each settlement
        uint256  poolAmount;          // accumulated pool for current round
        bool     isActive;

        // Timing
        uint256  totalDuration;       // seconds — lifetime of entire scheme
        uint256  biddingWindow;       // seconds — bidding/draw open per round
        uint256  schemeStartTime;     // set when circle becomes full (all members joined)
        uint256  roundStartTime;      // timestamp when current round's bidding opened
        bool     roundOpen;           // true when bidding window is active

        // Members
        address[] members;
        mapping(address => Member) memberData;

        // Auction state (reset each round)
        mapping(address => uint256) bids;
        address lowestBidder;
        uint256 lowestBid;
    }

    mapping(uint256 => Group) private groups;

    // ================================================================
    // EVENTS
    // ================================================================

    event GroupCreated(uint256 indexed groupId, PoolType poolType, uint256 totalDuration, uint256 biddingWindow);
    event MemberJoined(uint256 indexed groupId, address member);
    event SchemeStarted(uint256 indexed groupId, uint256 startTime);
    event RoundOpened(uint256 indexed groupId, uint256 round, uint256 deadline);
    event ContributionMade(uint256 indexed groupId, address member, uint256 round);
    event DepositUsedForMissedPayment(uint256 indexed groupId, address member, uint256 round);
    event BidPlaced(uint256 indexed groupId, address member, uint256 amount);
    event RoundSettled(uint256 indexed groupId, uint256 round, address winner, uint256 winnerPayout, uint256 surplusPerMember);
    event SecurityDepositReturned(uint256 indexed groupId, address member, uint256 amount);
    event SchemeCompleted(uint256 indexed groupId);
    event LoanIssued(uint256 indexed groupId, address member, uint256 amount);
    event LoanRepaid(uint256 indexed groupId, address member, uint256 principal, uint256 interest);
    event MemberLiquidated(uint256 indexed groupId, address member);
    event PlatformWithdrawn(uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event BalanceCredited(address indexed user, uint256 amount, string reason);

    // ================================================================
    // MODIFIERS
    // ================================================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier groupExists(uint256 groupId) {
        require(groupId > 0 && groupId <= groupCount, "No such group");
        _;
    }

    modifier onlyActiveGroup(uint256 groupId) {
        require(groups[groupId].isActive, "Group not active");
        _;
    }

    modifier onlyMember(uint256 groupId) {
        require(groups[groupId].memberData[msg.sender].isActive, "Not a member");
        _;
    }

    // ================================================================
    // CONSTRUCTOR
    // ================================================================

    constructor() {
        admin = msg.sender;
    }

    // ================================================================
    // GROUP CREATION
    // ================================================================

    /**
     * @param _contributionAmount  ETH per member per round (= security deposit)
     * @param _maxMembers          How many members (= how many rounds)
     * @param _type                Auction or LuckyDraw
     * @param _totalDuration       Total scheme lifetime in seconds
     * @param _biddingWindow       Bidding/draw open window per round in seconds
     */
    function createGroup(
        uint256  _contributionAmount,
        uint256  _maxMembers,
        PoolType _type,
        uint256  _totalDuration,
        uint256  _biddingWindow
    ) external onlyAdmin {
        require(_maxMembers >= 2,                        "Need at least 2 members");
        require(_contributionAmount > 0,                 "Contribution must be > 0");
        require(_totalDuration > 0,                      "Duration must be > 0");
        require(_biddingWindow > 0,                      "Bidding window must be > 0");
        require(_biddingWindow <= _totalDuration / _maxMembers, "Bidding window exceeds round interval");

        groupCount++;
        Group storage g = groups[groupCount];
        g.poolType           = _type;
        g.contributionAmount = _contributionAmount;
        g.maxMembers         = _maxMembers;
        g.currentRound       = 1;
        g.isActive           = true;
        g.totalDuration      = _totalDuration;
        g.biddingWindow      = _biddingWindow;

        emit GroupCreated(groupCount, _type, _totalDuration, _biddingWindow);
    }

    // ================================================================
    // JOIN GROUP  (pays security deposit)
    // ================================================================

    function joinGroup(uint256 groupId)
        external payable
        onlyActiveGroup(groupId)
        groupExists(groupId)
    {
        Group storage g = groups[groupId];
        require(g.schemeStartTime == 0,              "Scheme already started");
        require(g.members.length < g.maxMembers,     "Circle is full");
        require(!g.memberData[msg.sender].isActive,  "Already a member");
        require(msg.value == g.contributionAmount,   "Send exact security deposit");

        g.members.push(msg.sender);
        g.memberData[msg.sender] = Member({
            isActive:             true,
            hasWon:               false,
            hasActiveLoan:        false,
            depositUsed:          false,
            totalContributed:     0,
            securityDeposit:      msg.value,
            loanAmount:           0,
            loanInterest:         0,
            contributedThisRound: false
        });

        emit MemberJoined(groupId, msg.sender);

        // Auto-start scheme when circle fills up
        if (g.members.length == g.maxMembers) {
            g.schemeStartTime = block.timestamp;
            g.roundStartTime  = block.timestamp;
            g.roundOpen       = true;
            emit SchemeStarted(groupId, block.timestamp);
            emit RoundOpened(groupId, 1, block.timestamp + g.biddingWindow);
        }
    }

    // ================================================================
    // CONTRIBUTE  (pays pool deposit for current round)
    // ================================================================

    function contribute(uint256 groupId)
        external payable
        onlyActiveGroup(groupId)
        onlyMember(groupId)
    {
        Group storage g = groups[groupId];
        require(g.roundOpen,                                       "Round not open");
        require(!g.memberData[msg.sender].contributedThisRound,    "Already contributed this round");
        require(msg.value == g.contributionAmount,                 "Send exact contribution amount");

        g.poolAmount                              += msg.value;
        g.memberData[msg.sender].totalContributed += msg.value;
        g.memberData[msg.sender].contributedThisRound = true;

        emit ContributionMade(groupId, msg.sender, g.currentRound);
    }

    // ================================================================
    // BID  (Auction only — within bidding window)
    // ================================================================

    function placeBid(uint256 groupId, uint256 bidAmount)
        external
        onlyActiveGroup(groupId)
        onlyMember(groupId)
    {
        Group storage g = groups[groupId];
        require(g.poolType == PoolType.Auction,          "Not an auction circle");
        require(g.roundOpen,                             "Bidding window not open");
        require(!_biddingWindowExpired(g),               "Bidding window closed");
        require(!g.memberData[msg.sender].hasWon,        "Past winners cannot bid");
        // No contribution required to bid — bidding only decides payout amounts
        require(bidAmount > 0,                           "Bid must be > 0");

        // Net pool after platform fee — bid must be <= this
        uint256 netPool = (_currentNetPool(g) * (100 - PLATFORM_FEE_PERCENT)) / 100;
        require(bidAmount <= netPool,                    "Bid exceeds net pool");

        g.bids[msg.sender] = bidAmount;

        if (g.lowestBid == 0 || bidAmount < g.lowestBid) {
            g.lowestBid    = bidAmount;
            g.lowestBidder = msg.sender;
        }

        emit BidPlaced(groupId, msg.sender, bidAmount);
    }

    // ================================================================
    // SETTLE ROUND  (callable by anyone after bidding window closes)
    // ================================================================

    /**
     * Steps:
     * 1. Cover missed pool deposits from security deposits.
     * 2. Take 10% platform fee.
     * 3. Select winner (auction→lowest bidder | lucky draw→pseudo-random).
     * 4. Auction: pay winner their bid; split surplus equally among all members.
     *    Lucky Draw: pay winner full net pool.
     * 5. Deduct any active loan from winner payout.
     * 6. Increment round. If all rounds done → return deposits & close scheme.
     */
    function settleRound(uint256 groupId)
        external
        onlyActiveGroup(groupId)
        groupExists(groupId)
    {
        Group storage g = groups[groupId];
        require(g.roundOpen,              "No open round");
        require(_biddingWindowExpired(g), "Bidding window still open");

        // ── 1. Cover missed payments from security deposits ──────
        for (uint256 i = 0; i < g.members.length; i++) {
            address addr = g.members[i];
            Member storage m = g.memberData[addr];
            if (!m.isActive) continue;
            if (!m.contributedThisRound) {
                if (m.securityDeposit >= g.contributionAmount) {
                    // Use security deposit as pool deposit
                    g.poolAmount          += g.contributionAmount;
                    m.totalContributed    += g.contributionAmount;
                    m.securityDeposit     -= g.contributionAmount;
                    if (m.securityDeposit == 0) m.depositUsed = true;
                    m.contributedThisRound = true;
                    emit DepositUsedForMissedPayment(groupId, addr, g.currentRound);
                }
                // else: deposit already exhausted — member simply misses this round
            }
        }

        uint256 totalPool = g.poolAmount;
        require(totalPool > 0, "Empty pool");

        // ── 2. Platform fee ──────────────────────────────────────
        uint256 fee           = (totalPool * PLATFORM_FEE_PERCENT) / 100;
        platformBalance      += fee;
        uint256 distributable = totalPool - fee;

        // ── 3. Select winner ─────────────────────────────────────
        address winner;
        bool usedAuctionLogic;

        if (g.poolType == PoolType.Auction && g.lowestBidder != address(0)) {
            // Normal auction — lowest bidder wins
            winner = g.lowestBidder;
            usedAuctionLogic = true;
        } else {
            // LuckyDraw OR Auction with no bids → random winner fallback
            address[] memory eligible = _eligibleMembers(g);
            require(eligible.length > 0, "No eligible members");
            uint256 rand  = uint256(keccak256(abi.encodePacked(
                block.timestamp, block.prevrandao, groupId, g.currentRound
            )));
            winner = eligible[rand % eligible.length];
            usedAuctionLogic = false;
        }

        require(g.memberData[winner].isActive, "Winner is not active");
        require(!g.memberData[winner].hasWon,  "Winner already won");

        // ── 4. Payouts ───────────────────────────────────────────
        uint256 winnerPayout;
        uint256 surplusPerMember;
        uint256 activeCount = _activeCount(g);

        if (usedAuctionLogic) {
            // Auction: winner gets their bid amount, surplus split among all
            winnerPayout     = g.lowestBid;
            uint256 surplus  = distributable - g.lowestBid;
            surplusPerMember = activeCount > 0 ? surplus / activeCount : 0;
        } else {
            // LuckyDraw (or auction fallback): winner gets full net pool
            winnerPayout     = distributable;
            surplusPerMember = 0;
        }

        // ── 5. Loan deduction from winner ────────────────────────
        Member storage wm = g.memberData[winner];
        if (wm.hasActiveLoan) {
            uint256 totalLoan = wm.loanAmount + wm.loanInterest;
            if (winnerPayout >= totalLoan) {
                winnerPayout       -= totalLoan;
                platformBalance    += totalLoan; // full repayment (principal + interest) goes to platform treasury
                emit LoanRepaid(groupId, winner, wm.loanAmount, wm.loanInterest);
            } else {
                // payout covers partial; rest forgiven for simplicity
                platformBalance    += winnerPayout;
                emit LoanRepaid(groupId, winner, winnerPayout, 0);
                winnerPayout        = 0;
            }
            wm.loanAmount     = 0;
            wm.loanInterest   = 0;
            wm.hasActiveLoan  = false;
        }

        wm.hasWon    = true;
        g.poolAmount = 0;

        // ── Credit winner payout to withdrawable balance ─────────
        if (winnerPayout > 0) {
            withdrawableBalance[winner] += winnerPayout;
            emit BalanceCredited(winner, winnerPayout, "round_winner");
        }

        // ── Credit surplus to all active members (Auction) ───────
        if (surplusPerMember > 0) {
            for (uint256 i = 0; i < g.members.length; i++) {
                address addr = g.members[i];
                if (!g.memberData[addr].isActive) continue;
                withdrawableBalance[addr] += surplusPerMember;
                emit BalanceCredited(addr, surplusPerMember, "auction_surplus");
            }
        }

        emit RoundSettled(groupId, g.currentRound, winner, winnerPayout, surplusPerMember);

        // ── 6. Advance state ─────────────────────────────────────
        // Reset per-round state
        g.roundOpen   = false;
        g.lowestBid   = 0;
        g.lowestBidder = address(0);
        for (uint256 i = 0; i < g.members.length; i++) {
            g.memberData[g.members[i]].contributedThisRound = false;
            delete g.bids[g.members[i]];
        }

        g.currentRound++;

        // Check if all rounds completed
        if (g.currentRound > g.maxMembers) {
            _finalizeScheme(groupId);
        } else {
            // Open next round immediately
            g.roundStartTime = block.timestamp;
            g.roundOpen      = true;
            emit RoundOpened(groupId, g.currentRound, block.timestamp + g.biddingWindow);
        }
    }

    // ================================================================
    // INTERNAL HELPERS
    // ================================================================

    function _biddingWindowExpired(Group storage g) internal view returns (bool) {
        return block.timestamp >= g.roundStartTime + g.biddingWindow;
    }

    function _currentNetPool(Group storage g) internal view returns (uint256) {
        return g.poolAmount;
    }

    function _eligibleMembers(Group storage g) internal view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < g.members.length; i++) {
            address a = g.members[i];
            if (g.memberData[a].isActive && !g.memberData[a].hasWon) count++;
        }
        address[] memory out = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < g.members.length; i++) {
            address a = g.members[i];
            if (g.memberData[a].isActive && !g.memberData[a].hasWon) out[idx++] = a;
        }
        return out;
    }

    function _activeCount(Group storage g) internal view returns (uint256) {
        uint256 c = 0;
        for (uint256 i = 0; i < g.members.length; i++) {
            if (g.memberData[g.members[i]].isActive) c++;
        }
        return c;
    }

    function _finalizeScheme(uint256 groupId) internal {
        Group storage g = groups[groupId];
        // Credit security deposits to withdrawable balance for genuine members
        for (uint256 i = 0; i < g.members.length; i++) {
            address addr = g.members[i];
            Member storage m = g.memberData[addr];
            if (m.isActive && !m.depositUsed && m.securityDeposit > 0) {
                uint256 refund  = m.securityDeposit;
                m.securityDeposit = 0;
                withdrawableBalance[addr] += refund;
                emit BalanceCredited(addr, refund, "deposit_refund");
                emit SecurityDepositReturned(groupId, addr, refund);
            }
        }
        g.isActive = false;
        emit SchemeCompleted(groupId);
    }

    // ================================================================
    // WITHDRAW  (pull-payment — users collect their funds)
    // ================================================================

    /**
     * @notice Withdraw all credited funds (winnings, surplus, deposit refunds).
     *         Creates a real outgoing transaction visible in MetaMask.
     */
    function withdraw() external {
        uint256 amount = withdrawableBalance[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        withdrawableBalance[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Withdraw failed");

        emit Withdrawal(msg.sender, amount);
    }

    // ================================================================
    // P2P LOAN SYSTEM  (member-initiated, trust-score checked off-chain)
    // ================================================================

    /**
     * @notice Request a loan against your enrolled circle.
     *         Eligibility: active member, not yet won, no existing loan,
     *         scheme must be started (full circle), trust score ≥ 500 (checked off-chain).
     *         Loan = 50% of plan value (contributionAmount × maxMembers).
     *         Repayment = principal + 18% (10% platform + 8% interest).
     *         Auto-deducted from winner payout on settleRound().
     */
    function requestLoan(uint256 groupId)
        external
        onlyActiveGroup(groupId)
        onlyMember(groupId)
    {
        Group storage g = groups[groupId];
        Member storage m = g.memberData[msg.sender];

        require(g.schemeStartTime > 0,  "Scheme not started yet");
        require(!m.hasWon,              "Already won - not eligible");
        require(!m.hasActiveLoan,       "Loan already active");

        // Loan = 50% of plan value
        uint256 planValue  = g.contributionAmount * g.maxMembers;
        uint256 loanAmount = planValue / 2;

        // Interest = 18% total (10% platform fee + 8% interest)
        uint256 totalInterestPercent = LOAN_PLATFORM_PERCENT + LOAN_INTEREST_PERCENT;
        uint256 interest = (loanAmount * totalInterestPercent) / 100;

        m.loanAmount    = loanAmount;
        m.loanInterest  = interest;
        m.hasActiveLoan = true;

        // Credit loan to withdrawable balance (pull-payment)
        withdrawableBalance[msg.sender] += loanAmount;
        emit BalanceCredited(msg.sender, loanAmount, "loan");
        emit LoanIssued(groupId, msg.sender, loanAmount);
    }

    /**
     * @notice Admin can also issue a custom loan (backwards compatibility).
     *         Same rules apply but admin sets amount & interest.
     */
    function issueLoan(
        uint256 groupId,
        address member,
        uint256 loanAmount,
        uint256 interest
    ) external onlyAdmin onlyActiveGroup(groupId) {
        Group storage g = groups[groupId];
        Member storage m = g.memberData[member];
        require(m.isActive,        "Not a member");
        require(!m.hasWon,         "Already won");
        require(!m.hasActiveLoan,  "Loan already active");

        uint256 maxLoan = (g.contributionAmount * g.maxMembers) / 2;
        require(loanAmount <= maxLoan, "Exceeds 50% of plan value");

        m.loanAmount    = loanAmount;
        m.loanInterest  = interest;
        m.hasActiveLoan = true;

        // Loans are also credited to withdrawable balance
        withdrawableBalance[member] += loanAmount;
        emit BalanceCredited(member, loanAmount, "loan");
        emit LoanIssued(groupId, member, loanAmount);
    }

    // ================================================================
    // LIQUIDATION  (admin only)
    // ================================================================

    function liquidateMember(uint256 groupId, address member)
        external onlyAdmin
    {
        Group storage g = groups[groupId];
        Member storage m = g.memberData[member];
        require(m.isActive, "Not a member");

        // Forfeit security deposit to platform
        if (m.securityDeposit > 0) {
            platformBalance   += m.securityDeposit;
            m.securityDeposit  = 0;
        }

        m.isActive       = false;
        m.hasActiveLoan  = false;
        m.loanAmount     = 0;
        m.loanInterest   = 0;

        emit MemberLiquidated(groupId, member);
    }

    // ================================================================
    // PLATFORM WITHDRAW  (admin only)
    // ================================================================

    function withdrawPlatformFees() external onlyAdmin {
        uint256 amount = platformBalance;
        require(amount > 0, "No fees to withdraw");
        platformBalance = 0;
        (bool ok, ) = payable(admin).call{value: amount}("");
        require(ok, "Withdraw failed");
        emit PlatformWithdrawn(amount);
    }

    // ================================================================
    // VIEW FUNCTIONS
    // ================================================================

    function getGroupInfo(uint256 groupId)
        external view
        returns (
            PoolType poolType,
            uint256  contributionAmount,
            uint256  maxMembers,
            uint256  currentRound,
            uint256  poolAmount,
            bool     isActive,
            uint256  memberCount
        )
    {
        Group storage g = groups[groupId];
        return (
            g.poolType,
            g.contributionAmount,
            g.maxMembers,
            g.currentRound,
            g.poolAmount,
            g.isActive,
            g.members.length
        );
    }

    function getGroupTiming(uint256 groupId)
        external view
        returns (
            uint256 totalDuration,
            uint256 biddingWindow,
            uint256 schemeStartTime,
            uint256 roundStartTime,
            bool    roundOpen,
            uint256 roundDeadline
        )
    {
        Group storage g = groups[groupId];
        uint256 deadline = g.roundOpen ? g.roundStartTime + g.biddingWindow : 0;
        return (
            g.totalDuration,
            g.biddingWindow,
            g.schemeStartTime,
            g.roundStartTime,
            g.roundOpen,
            deadline
        );
    }

    function getGroupMembers(uint256 groupId)
        external view returns (address[] memory)
    {
        return groups[groupId].members;
    }

    function getMemberData(uint256 groupId, address member)
        external view
        returns (
            bool    isActive,
            bool    hasWon,
            bool    hasActiveLoan,
            bool    depositUsed,
            bool    contributedThisRound,
            uint256 totalContributed,
            uint256 securityDeposit,
            uint256 loanAmount,
            uint256 loanInterest
        )
    {
        Member storage m = groups[groupId].memberData[member];
        return (
            m.isActive,
            m.hasWon,
            m.hasActiveLoan,
            m.depositUsed,
            m.contributedThisRound,
            m.totalContributed,
            m.securityDeposit,
            m.loanAmount,
            m.loanInterest
        );
    }

    function getMemberBid(uint256 groupId, address member)
        external view returns (uint256)
    {
        return groups[groupId].bids[member];
    }

    function getLowestBid(uint256 groupId)
        external view returns (address bidder, uint256 amount)
    {
        Group storage g = groups[groupId];
        return (g.lowestBidder, g.lowestBid);
    }

    function getRoundInterval(uint256 groupId)
        external view returns (uint256)
    {
        Group storage g = groups[groupId];
        if (g.maxMembers == 0) return 0;
        return g.totalDuration / g.maxMembers;
    }

    /**
     * @notice Get the withdrawable balance for any address.
     */
    function getWithdrawableBalance(address user)
        external view returns (uint256)
    {
        return withdrawableBalance[user];
    }

    /**
     * @notice Check if a member is eligible for a loan and return loan terms.
     * @return eligible     Whether the member can request a loan
     * @return loanAmount   50% of plan value
     * @return interest     18% of loanAmount (10% platform + 8% interest)
     * @return totalRepay   loanAmount + interest
     * @return reason       Human-readable reason if not eligible
     */
    function getLoanTerms(uint256 groupId, address member)
        external view
        groupExists(groupId)
        returns (
            bool    eligible,
            uint256 loanAmount,
            uint256 interest,
            uint256 totalRepay,
            string memory reason
        )
    {
        Group storage g = groups[groupId];
        Member storage m = g.memberData[member];

        uint256 planValue = g.contributionAmount * g.maxMembers;
        loanAmount = planValue / 2;
        uint256 totalInterestPercent = LOAN_PLATFORM_PERCENT + LOAN_INTEREST_PERCENT;
        interest   = (loanAmount * totalInterestPercent) / 100;
        totalRepay = loanAmount + interest;

        if (!g.isActive)           return (false, loanAmount, interest, totalRepay, "Circle not active");
        if (g.schemeStartTime == 0) return (false, loanAmount, interest, totalRepay, "Scheme not started");
        if (!m.isActive)           return (false, loanAmount, interest, totalRepay, "Not a member");
        if (m.hasWon)              return (false, loanAmount, interest, totalRepay, "Already won");
        if (m.hasActiveLoan)       return (false, loanAmount, interest, totalRepay, "Loan already active");

        return (true, loanAmount, interest, totalRepay, "");
    }
}