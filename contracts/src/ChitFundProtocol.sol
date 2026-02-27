// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChitFundProtocol {

    // =============================================================
    // ENUMS
    // =============================================================

    enum PoolType {
        Auction,
        LuckyDraw
    }

    // =============================================================
    // STATE VARIABLES
    // =============================================================

    address public admin;
    uint256 public groupCount;

    uint256 public platformBalance;
    uint256 public constant PLATFORM_FEE_PERCENT = 10;

    constructor() {
        admin = msg.sender;
    }

    // =============================================================
    // STRUCTS
    // =============================================================

    struct Member {
        bool isActive;
        bool hasWon;
        uint256 totalContributed;
        uint256 securityDeposit;
        uint256 loanAmount;
        uint256 loanInterest;
        bool hasActiveLoan;
    }

    struct Group {
        PoolType poolType;
        uint256 contributionAmount;
        uint256 maxMembers;
        uint256 currentRound;
        uint256 poolAmount;
        bool isActive;

        address[] members;

        mapping(address => Member) memberData;

        // Auction specific
        mapping(address => uint256) bids;
        address lowestBidder;
        uint256 lowestBid;
    }

    mapping(uint256 => Group) private groups;

    // =============================================================
    // EVENTS
    // =============================================================

    event GroupCreated(uint256 groupId);
    event MemberJoined(uint256 groupId, address member);
    event ContributionMade(uint256 groupId, address member);
    event BidPlaced(uint256 groupId, address member, uint256 amount);
    event WinnerSelected(uint256 groupId, address winner, uint256 payout);
    event LoanIssued(uint256 groupId, address member, uint256 amount);
    event MemberLiquidated(uint256 groupId, address member);
    event PlatformWithdrawn(uint256 amount);

    // =============================================================
    // MODIFIERS
    // =============================================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyActiveGroup(uint256 groupId) {
        require(groups[groupId].isActive, "Group not active");
        _;
    }

    modifier onlyMember(uint256 groupId) {
        require(groups[groupId].memberData[msg.sender].isActive, "Not member");
        _;
    }

    // =============================================================
    // GROUP CREATION
    // =============================================================

    function createGroup(
        uint256 _contributionAmount,
        uint256 _maxMembers,
        PoolType _type
    ) external onlyAdmin {

        require(_maxMembers > 1, "Invalid members");

        groupCount++;

        Group storage g = groups[groupCount];
        g.poolType = _type;
        g.contributionAmount = _contributionAmount;
        g.maxMembers = _maxMembers;
        g.currentRound = 1;
        g.isActive = true;

        emit GroupCreated(groupCount);
    }

    // =============================================================
    // JOIN GROUP
    // =============================================================

    function joinGroup(uint256 groupId)
        external
        payable
        onlyActiveGroup(groupId)
    {
        Group storage g = groups[groupId];

        require(g.members.length < g.maxMembers, "Group full");
        require(!g.memberData[msg.sender].isActive, "Already joined");
        require(msg.value == g.contributionAmount, "Deposit required");

        g.members.push(msg.sender);

        g.memberData[msg.sender] = Member({
            isActive: true,
            hasWon: false,
            totalContributed: 0,
            securityDeposit: msg.value,
            loanAmount: 0,
            loanInterest: 0,
            hasActiveLoan: false
        });

        emit MemberJoined(groupId, msg.sender);
    }

    // =============================================================
    // CONTRIBUTION
    // =============================================================

    function contribute(uint256 groupId)
        external
        payable
        onlyActiveGroup(groupId)
        onlyMember(groupId)
    {
        Group storage g = groups[groupId];

        require(msg.value == g.contributionAmount, "Incorrect amount");

        g.poolAmount += msg.value;
        g.memberData[msg.sender].totalContributed += msg.value;

        emit ContributionMade(groupId, msg.sender);
    }

    // =============================================================
    // AUCTION BIDDING
    // =============================================================

    function placeBid(uint256 groupId, uint256 bidAmount)
        external
        onlyActiveGroup(groupId)
        onlyMember(groupId)
    {
        Group storage g = groups[groupId];
        require(g.poolType == PoolType.Auction, "Not auction pool");
        require(!g.memberData[msg.sender].hasWon, "Already won");

        require(bidAmount < g.poolAmount, "Invalid bid");

        g.bids[msg.sender] = bidAmount;

        if (g.lowestBid == 0 || bidAmount < g.lowestBid) {
            g.lowestBid = bidAmount;
            g.lowestBidder = msg.sender;
        }

        emit BidPlaced(groupId, msg.sender, bidAmount);
    }

    // =============================================================
    // SELECT WINNER
    // =============================================================

    function selectWinner(uint256 groupId)
        external
        onlyAdmin
        onlyActiveGroup(groupId)
    {
        Group storage g = groups[groupId];
        address winner;

        // Determine winner
        if (g.poolType == PoolType.Auction) {
            require(g.lowestBidder != address(0), "No bids placed yet");
            winner = g.lowestBidder;
        } else {
            uint256 rand = uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, block.prevrandao)
                )
            );
            uint256 index = rand % g.members.length;
            winner = g.members[index];
        }

        require(!g.memberData[winner].hasWon, "Already won");

        uint256 totalPool = g.poolAmount;
        require(totalPool > 0, "Pool is empty - members must contribute first");

        // 1️⃣ Platform Fee (10%)
        uint256 platformFee = (totalPool * PLATFORM_FEE_PERCENT) / 100;
        platformBalance += platformFee;

        uint256 remainingPool = totalPool - platformFee;

        uint256 payout = remainingPool;

        // 2️⃣ Auction Discount
        if (g.poolType == PoolType.Auction) {
            payout -= g.lowestBid;
        }

        // 3️⃣ Loan Deduction
        Member storage m = g.memberData[winner];

        if (m.hasActiveLoan) {
            uint256 totalLoan = m.loanAmount + m.loanInterest;
            require(payout >= totalLoan, "Loan exceeds payout");

            payout -= totalLoan;

            m.loanAmount = 0;
            m.loanInterest = 0;
            m.hasActiveLoan = false;
        }

        m.hasWon = true;
        g.poolAmount = 0;
        g.currentRound++;

        (bool success, ) = payable(winner).call{value: payout}("");
        require(success, "Transfer failed");

        emit WinnerSelected(groupId, winner, payout);
    }

    // =============================================================
    // LOAN SYSTEM
    // =============================================================

    function issueLoan(
        uint256 groupId,
        address member,
        uint256 loanAmount,
        uint256 interest
    )
        external
        onlyAdmin
        onlyActiveGroup(groupId)
    {
        Group storage g = groups[groupId];
        Member storage m = g.memberData[member];

        require(m.isActive, "Not member");
        require(!m.hasWon, "Already won");
        require(!m.hasActiveLoan, "Loan exists");

        uint256 maxLoan = g.poolAmount / 2;
        require(loanAmount <= maxLoan, "Exceeds max loan");

        m.loanAmount = loanAmount;
        m.loanInterest = interest;
        m.hasActiveLoan = true;

        (bool success, ) = payable(member).call{value: loanAmount}("");
        require(success, "Loan transfer failed");

        emit LoanIssued(groupId, member, loanAmount);
    }

    // =============================================================
    // LIQUIDATION
    // =============================================================

    function liquidateMember(uint256 groupId, address member)
        external
        onlyAdmin
    {
        Group storage g = groups[groupId];
        Member storage m = g.memberData[member];

        require(m.isActive, "Not member");

        m.isActive = false;
        m.hasActiveLoan = false;
        m.loanAmount = 0;
        m.loanInterest = 0;

        emit MemberLiquidated(groupId, member);
    }

    // =============================================================
    // PLATFORM WITHDRAW
    // =============================================================

    function withdrawPlatformFees() external onlyAdmin {
        uint256 amount = platformBalance;
        require(amount > 0, "No fees");

        platformBalance = 0;

        (bool success, ) = payable(admin).call{value: amount}("");
        require(success, "Withdraw failed");

        emit PlatformWithdrawn(amount);
    }

    // =============================================================
    // VIEW FUNCTIONS (for frontend)
    // =============================================================

    function getGroupInfo(uint256 groupId)
        external
        view
        returns (
            PoolType poolType,
            uint256 contributionAmount,
            uint256 maxMembers,
            uint256 currentRound,
            uint256 poolAmount,
            bool isActive,
            uint256 memberCount,
            address lowestBidder,
            uint256 lowestBid
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
            g.members.length,
            g.lowestBidder,
            g.lowestBid
        );
    }

    function getGroupMembers(uint256 groupId)
        external
        view
        returns (address[] memory)
    {
        return groups[groupId].members;
    }

    function getMemberData(uint256 groupId, address member)
        external
        view
        returns (
            bool isActive,
            bool hasWon,
            uint256 totalContributed,
            uint256 securityDeposit,
            uint256 loanAmount,
            uint256 loanInterest,
            bool hasActiveLoan
        )
    {
        Member storage m = groups[groupId].memberData[member];
        return (
            m.isActive,
            m.hasWon,
            m.totalContributed,
            m.securityDeposit,
            m.loanAmount,
            m.loanInterest,
            m.hasActiveLoan
        );
    }

    function getMemberBid(uint256 groupId, address member)
        external
        view
        returns (uint256)
    {
        return groups[groupId].bids[member];
    }

}