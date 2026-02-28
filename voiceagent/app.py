"""
Prospera Voice Agent - FastAPI + LangGraph + Gemini Native Audio
START -> Voice Agent -> [conditional edge] -> Tool -> Voice Agent -> END

Conversational voice assistant that answers Prospera platform questions,
asks clarifying questions, then delivers final answers.
"""

import os
import asyncio
import logging
import json
from typing import Annotated, List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(override=True)

API_KEY = os.getenv("GEMINI_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

# LangGraph imports
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field

# FastAPI imports
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Gemini WebSocket
import websockets

# LangChain imports
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langgraph.checkpoint.memory import MemorySaver
from langchain_community.utilities import GoogleSerperAPIWrapper

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def clean_transcription(text: str) -> str:
    """Extract only English/Latin text. If input has no Latin text, return empty string."""
    if not text:
        return ""
    # Extract only Latin/ASCII characters and common punctuation
    latin_chars = [c for c in text if ord(c) <= 0x024F or c in ' .,?!\'\":-;()%$#@&']
    cleaned = ''.join(latin_chars).strip()
    # Return cleaned text only if it has meaningful content
    return cleaned if len(cleaned) >= 2 else ""

# FastAPI app
app = FastAPI(title="Prospera Voice Agent", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PROSPERA KNOWLEDGE BASE
# ==========================================

PROSPERA_KNOWLEDGE = """
CRITICAL RULES:
1. ALWAYS transcribe user speech in ENGLISH ONLY using Latin alphabet — never use Devanagari, Hindi, or any non-Latin script
2. If the user speaks Hindi or another language, TRANSLITERATE it to English phonetically (e.g., "Good morning" not "गुड मॉर्निंग")
3. ALWAYS respond and speak in English only, regardless of the user's language or accent
4. If you cannot understand the user's speech clearly, ask them to repeat rather than guessing
5. Listen carefully to the full question before responding — do not cut off early
6. Answer with specific facts and numbers from your knowledge base whenever possible

You are the Prospera Premium Voice Concierge - an elite financial voice assistant for Prospera,
a Web3 collaborative savings platform (also known as chit funds / savings circles).

CORE PLATFORM KNOWLEDGE:
- Prospera is a premium collaborative savings platform using blockchain (Web3) technology
- Users join savings Circles where members pool monthly contributions
- Each month, one member receives the full pool through a bidding/auction process
- Members have Trust Scores that determine their credibility and bidding privileges
- The platform uses smart contracts on blockchain for transparency and security
- Currency: INR (use Rs. symbol). Format numbers with commas (e.g., Rs. 1,00,000)

HOW CIRCLES WORK:
1. POOL PHASE (Lucky Draw): Members contribute monthly installments to a shared pool
2. BIDDING PHASE (Auction): Members bid to receive the pooled amount - lowest bid wins
3. LENDING PHASE: The pool winner receives funds; remaining members earn interest
4. Repeat until all members have received the pool once

CIRCLE TIERS (from mock data):
- Holiday Fun Elite 2024: Rs. 500/mo, Pool Rs. 6,000 - ACTIVE
- Investment Pool Alpha: Rs. 1,000/mo, Pool Rs. 12,000 - LOCKED
- Luxe Vehicle Fund: Rs. 2,500/mo, Pool Rs. 30,000 - ACTIVE
- Emergency Cushion: Rs. 100/mo, Pool Rs. 1,200 - ACTIVE

PLATFORM FEES:
- Prospera charges a 10% platform fee on each transaction/payout
- This fee funds platform operations, smart contract security, Elite Payouts, and the Trust Score system
- The fee is transparently disclosed in the Smart Contract before joining any Circle

PLATFORM FEATURES:
- Smart Ledger: Immutable transactional transparency with encryption
- Automated Bidding: AI-powered fair rotation and payout scheduling
- Elite Payouts: Instant fund distribution with 99.9% uptime
- Trust Score: Reputation system based on payment history and participation
- KYC Verification: Admin/moderator verified identity system
- Dashboard: Overview, My Circles, Activity Log, Live Bidding, Rewards, Preferences

USER ROLES:
- Customer: Can join circles, bid, view dashboard
- Moderator: Can flag/review users, manage KYC
- Admin: Full platform control, create circles, manage all users

CONVERSATIONAL STYLE:
- Be warm, professional, and concise
- ALWAYS give direct, precise answers with specific numbers and facts FIRST, then offer to elaborate
- For example: if asked about platform fees, say "Prospera charges a 10% platform fee on each transaction" — do NOT say "it depends" or ask clarifying questions when the answer is clear
- Only ask clarifying questions when the question is genuinely ambiguous and you truly cannot determine the intent
- If the user corrects you or provides information, acknowledge it and incorporate it immediately
- Maintain multi-turn conversation context — remember what was discussed earlier in the conversation
- If asked about something outside Prospera, politely redirect to platform topics
- Keep responses under 80 words for voice-friendly delivery — be brief and to the point
- Use a premium, concierge-like tone matching the luxury brand
- NEVER start with generic greetings like "Welcome to Prospera" mid-conversation — go straight to the answer
"""

# ==========================================
# STATE
# ==========================================

class VoiceState(BaseModel):
    """State for voice workflow"""
    messages: Annotated[List, add_messages] = []
    user_input: Optional[str] = None
    tool_results: List[str] = Field(default_factory=list)
    final_response: Optional[str] = None
    tool_call_count: int = 0
    session_id: Optional[str] = None
    needs_clarification: bool = False
    conversation_context: str = ""

# ==========================================
# TOOLS
# ==========================================

@tool
def web_search(query: str) -> str:
    """Search the web for current information about financial topics, chit funds, or savings"""
    try:
        search = GoogleSerperAPIWrapper(serper_api_key=SERPER_API_KEY, k=5)
        result = search.run(query)
        return f"Search results: {result}" if result else f"No results for: {query}"
    except Exception as e:
        return f"Search failed: {str(e)}"


@tool
def get_circle_info(circle_name: str) -> str:
    """Get information about a specific Prospera savings circle"""
    circles = {
        "holiday fun elite": {"name": "Holiday Fun Elite 2024", "installment": "Rs. 500/mo", "pool": "Rs. 6,000", "status": "ACTIVE", "next_date": "Dec 12"},
        "investment pool alpha": {"name": "Investment Pool Alpha", "installment": "Rs. 1,000/mo", "pool": "Rs. 12,000", "status": "LOCKED", "next_date": "Nov 28"},
        "luxe vehicle fund": {"name": "Luxe Vehicle Fund", "installment": "Rs. 2,500/mo", "pool": "Rs. 30,000", "status": "ACTIVE", "next_date": "Jan 05"},
        "emergency cushion": {"name": "Emergency Cushion", "installment": "Rs. 100/mo", "pool": "Rs. 1,200", "status": "ACTIVE", "next_date": "Dec 20"},
    }
    key = circle_name.lower().strip()
    for k, v in circles.items():
        if key in k or k in key:
            return json.dumps(v)
    return f"Circle '{circle_name}' not found. Available circles: " + ", ".join(c["name"] for c in circles.values())


@tool
def get_platform_stats() -> str:
    """Get current Prospera platform statistics"""
    return json.dumps({
        "total_circles": 4,
        "active_circles": 3,
        "locked_circles": 1,
        "total_pool_value": "Rs. 49,200",
        "platform_uptime": "99.9%",
        "blockchain": "Smart Contracts Enabled",
        "trust_score_system": "Active"
    })

# ==========================================
# NODES
# ==========================================

async def voice_agent_node(state: VoiceState) -> VoiceState:
    """Voice Agent - Main conversational hub"""
    
    print(f"[VOICE AGENT] Processing: {state.user_input}")
    
    updated_messages = state.messages
    if state.user_input and not any(
        msg.content == state.user_input for msg in state.messages if hasattr(msg, "content")
    ):
        user_msg = HumanMessage(content=state.user_input)
        updated_messages = state.messages + [user_msg]
    
    # If we have tool results, generate final response using context
    if state.tool_results:
        print(f"[VOICE AGENT] Creating response with tool results")
        tool_info = "\n".join(state.tool_results)
        
        # Build conversation history
        history = ""
        for msg in updated_messages:
            if hasattr(msg, "content"):
                role = "User" if isinstance(msg, HumanMessage) else "Assistant"
                history += f"{role}: {msg.content}\n"
        
        response = f"Based on what I found: {tool_info[:500]}"
        ai_msg = AIMessage(content=response)
        final_messages = updated_messages + [ai_msg]
        
        return VoiceState(
            **state.model_dump(),
            messages=final_messages,
            final_response=response,
        )
    
    # New input - check if it's a conversational follow-up
    else:
        print(f"[VOICE AGENT] Processing new input")
        
        return VoiceState(
            **state.model_dump(),
            messages=updated_messages,
        )


async def tool_node(state: VoiceState) -> VoiceState:
    """Tool Node - Execute appropriate tool"""
    
    user_text = (state.user_input or "").lower()
    print(f"[TOOL] Analyzing query: {user_text}")
    
    # Decide which tool to use
    if any(kw in user_text for kw in ["circle", "pool", "fund", "savings"]):
        # Try circle lookup
        result = await asyncio.get_event_loop().run_in_executor(
            None, get_circle_info.invoke, {"circle_name": user_text}
        )
    elif any(kw in user_text for kw in ["stats", "platform", "overview", "how many"]):
        result = await asyncio.get_event_loop().run_in_executor(
            None, get_platform_stats.invoke, {}
        )
    else:
        # Web search for external queries
        result = await asyncio.get_event_loop().run_in_executor(
            None, web_search.invoke, {"query": f"Prospera chit fund {user_text}"}
        )
    
    print(f"[TOOL] Result obtained")
    
    tool_msg = ToolMessage(content=result, tool_call_id="tool_1", name="tool")
    updated_messages = state.messages + [tool_msg]
    
    return VoiceState(
        **state.model_dump(),
        messages=updated_messages,
        tool_results=state.tool_results + [result],
        tool_call_count=state.tool_call_count + 1,
    )

# ==========================================
# ROUTING
# ==========================================

def route_voice(state: VoiceState) -> str:
    """Decide: Voice Agent -> Tool OR Voice Agent -> END"""
    
    if state.tool_results:
        print(f"[ROUTING] Voice Agent -> END (has tool results)")
        return END
    
    search_keywords = [
        "stock", "price", "today", "current", "news", "weather",
        "latest", "search", "find", "look up", "stats", "platform",
        "circle info", "how many", "what is the"
    ]
    needs_search = any(kw in (state.user_input or "").lower() for kw in search_keywords)
    
    if needs_search:
        print(f"[ROUTING] Voice Agent -> Tool")
        return "tool"
    else:
        print(f"[ROUTING] Voice Agent -> END (conversational)")
        return END

# ==========================================
# WORKFLOW BUILDER
# ==========================================

def build_workflow():
    """Build: START -> Voice Agent -> [conditional] -> Tool -> Voice Agent -> END"""
    
    workflow = StateGraph(VoiceState)
    
    workflow.add_node("voice_agent", voice_agent_node)
    workflow.add_node("tool", tool_node)
    
    workflow.add_edge(START, "voice_agent")
    
    workflow.add_conditional_edges(
        "voice_agent",
        route_voice,
        {"tool": "tool", END: END},
    )
    
    workflow.add_edge("tool", "voice_agent")
    
    return workflow


workflow_graph = None

async def get_workflow():
    """Get or create workflow instance"""
    global workflow_graph
    if workflow_graph is None:
        builder = build_workflow()
        checkpointer = MemorySaver()
        workflow_graph = builder.compile(checkpointer=checkpointer)
        print("[WORKFLOW] Compiled successfully")
    return workflow_graph

# ==========================================
# VOICE SESSION MANAGER
# ==========================================

class VoiceSession:
    """Manages a single voice conversation session"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.websocket: Optional[WebSocket] = None
        self.gemini_ws = None
        self.conversation_turn = 0
        self.is_active = False
        self.history: List[Dict[str, str]] = []
    
    async def process_user_input(self, user_text: str) -> str:
        """Process user input through LangGraph workflow"""
        try:
            print(f"[SESSION {self.session_id}] USER: {user_text}")
            
            workflow = await get_workflow()
            
            initial_state = VoiceState(
                user_input=user_text,
                session_id=self.session_id,
            )
            
            config = {"configurable": {"thread_id": self.session_id}}
            final_state = await workflow.ainvoke(initial_state, config)
            
            if final_state.final_response:
                response = final_state.final_response
            else:
                # Use Prospera context for direct answers
                response = f"I understand you're asking about: {user_text}. Let me help you with that. Could you be more specific about what aspect of Prospera you'd like to know about?"
            
            self.history.append({"role": "user", "text": user_text})
            self.history.append({"role": "agent", "text": response})
            
            print(f"[SESSION {self.session_id}] AGENT: {response[:100]}...")
            return response
            
        except Exception as e:
            logger.error(f"[SESSION {self.session_id}] Error: {e}")
            return "I apologize for the inconvenience. Could you please repeat your question?"


active_sessions: Dict[str, VoiceSession] = {}

# ==========================================
# WEBSOCKET ENDPOINT
# ==========================================

@app.websocket("/api/ws/voice")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for voice communication with Gemini Native Audio.
    
    Architecture:
    - Frontend WebSocket stays open for the entire session lifetime.
    - Gemini bidiGenerateContent connection is created LAZILY: only when the
      first audio chunk arrives for a new turn.
    - After turnComplete, the Gemini session is closed and we wait for the
      next audio chunk before opening a new one.
    - This avoids the rapid reconnect loop caused by Gemini closing idle sessions.
    """
    
    await websocket.accept()
    session_id = f"prospera_voice_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
    session = VoiceSession(session_id)
    session.websocket = websocket
    active_sessions[session_id] = session
    
    print(f"[WS] New voice session: {session_id}")
    
    if not API_KEY:
        await websocket.send_json({"type": "error", "message": "GEMINI_API_KEY not configured."})
        await websocket.close()
        return
    
    gemini_url = (
        f"wss://generativelanguage.googleapis.com/ws/"
        f"google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
        f"?key={API_KEY}"
    )

    gemini_setup = {
        "setup": {
            "model": "models/gemini-2.5-flash-native-audio-preview-09-2025",
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {"voiceName": "Fenrir"}
                    }
                },
            },
            "inputAudioTranscription": {},
            "outputAudioTranscription": {},
            "systemInstruction": {
                "parts": [{"text": PROSPERA_KNOWLEDGE}]
            },
        }
    }

    # Queue: browser → current Gemini session (None when idle)
    audio_queue: asyncio.Queue = asyncio.Queue()
    frontend_alive = True

    # Tell frontend we're ready
    try:
        await websocket.send_json({"type": "ready", "session_id": session_id})
        print(f"[WS] Voice agent ready for input")
    except Exception:
        return

    # ── Receive from browser forever ─────────────────────────────────────────
    async def receive_from_browser():
        nonlocal frontend_alive
        try:
            while frontend_alive:
                data = await websocket.receive_json()
                msg_type = data.get("type")
                if msg_type in ("audio", "text"):
                    await audio_queue.put(data)
                elif msg_type == "close":
                    frontend_alive = False
                    break
        except WebSocketDisconnect:
            logger.info(f"[WS] Frontend disconnected: {session_id}")
        except Exception as e:
            logger.error(f"[WS] Browser receive error: {e}")
        finally:
            frontend_alive = False

    browser_task = asyncio.create_task(receive_from_browser())

    # ── One Gemini turn ───────────────────────────────────────────────────────
    async def run_gemini_turn(first_chunk):
        """Open a Gemini session, send first_chunk + subsequent chunks until turnComplete."""
        try:
            async with websockets.connect(gemini_url) as gemini_ws:
                session.gemini_ws = gemini_ws
                session.is_active = True
                session.conversation_turn += 1
                print(f"[WS] Gemini turn {session.conversation_turn} started")

                await gemini_ws.send(json.dumps(gemini_setup))

                # ── Forward audio to Gemini ───────────────────────────────────
                async def forward_audio():
                    # Send the first chunk that triggered this session
                    chunk = first_chunk
                    try:
                        while session.is_active and frontend_alive:
                            if chunk.get("type") == "audio":
                                await gemini_ws.send(json.dumps({
                                    "realtimeInput": {
                                        "mediaChunks": [{
                                            "data": chunk["audio"],
                                            "mimeType": "audio/pcm;rate=16000",
                                        }]
                                    }
                                }))
                            elif chunk.get("type") == "text":
                                text = chunk.get("text", "").strip()
                                if text:
                                    response = await session.process_user_input(text)
                                    await websocket.send_json({"type": "user", "text": text})
                                    await websocket.send_json({"type": "agent", "text": response})

                            # Get next chunk (short timeout so we detect turn end)
                            try:
                                chunk = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                            except asyncio.TimeoutError:
                                chunk = {"type": "noop"}  # keep loop alive
                    except Exception as e:
                        logger.error(f"[WS] Audio forward error: {e}")
                    finally:
                        session.is_active = False

                # ── Read Gemini responses ─────────────────────────────────────
                async def process_responses():
                    user_buf = []
                    agent_buf = []
                    try:
                        async for msg in gemini_ws:
                            if not session.is_active:
                                break
                            try:
                                resp = json.loads(msg)
                                if "serverContent" not in resp:
                                    continue
                                content = resp["serverContent"]

                                if "inputTranscription" in content:
                                    chunk_text = content["inputTranscription"].get("text", "")
                                    if chunk_text:
                                        user_buf.append(chunk_text)

                                if "outputTranscription" in content:
                                    chunk_text = content["outputTranscription"].get("text", "")
                                    if chunk_text:
                                        agent_buf.append(chunk_text)

                                if "modelTurn" in content:
                                    for part in content["modelTurn"].get("parts", []):
                                        if "inlineData" in part:
                                            audio = part["inlineData"]
                                            if "audio/pcm" in audio.get("mimeType", ""):
                                                await websocket.send_json({
                                                    "type": "audio",
                                                    "audio": audio["data"],
                                                })

                                if content.get("generationComplete"):
                                    pass  # buffer agent_buf until turnComplete so user msg goes first

                                if content.get("turnComplete"):
                                    # 1. User transcription first
                                    if user_buf:
                                        full_user = "".join(user_buf).strip()
                                        if full_user:
                                            logger.info(f"[WS] User (raw): {full_user}")
                                            display_user = clean_transcription(full_user)
                                            if not display_user:
                                                # No English text detected - show placeholder
                                                display_user = "🎤 [Voice]"
                                                logger.warning(f"[WS] Non-English transcription filtered: {full_user[:50]}")
                                            logger.info(f"[WS] User (display): {display_user}")
                                            await websocket.send_json({"type": "user", "text": display_user})
                                        user_buf = []
                                    # 2. Agent response second
                                    if agent_buf:
                                        full_agent = "".join(agent_buf).strip()
                                        if full_agent:
                                            logger.info(f"[WS] Agent: {full_agent}")
                                            await websocket.send_json({"type": "agent", "text": full_agent})
                                        agent_buf = []
                                    # 3. Signal done
                                    await websocket.send_json({"type": "turn_complete"})
                                    session.is_active = False
                                    break

                            except json.JSONDecodeError:
                                logger.warning("Non-JSON from Gemini")
                            except Exception as e:
                                logger.error(f"[WS] Response error: {e}")

                    except websockets.exceptions.ConnectionClosed:
                        logger.info(f"[WS] Gemini closed turn {session.conversation_turn}")
                    except Exception as e:
                        logger.error(f"[WS] Stream error: {e}")
                    finally:
                        session.is_active = False

                await asyncio.gather(forward_audio(), process_responses(), return_exceptions=True)
                print(f"[WS] Gemini turn {session.conversation_turn} complete")

        except Exception as e:
            logger.error(f"[WS] Gemini connect error: {e}")
            try:
                await websocket.send_json({"type": "error", "message": str(e)})
            except Exception:
                pass

    # ── Main loop: idle until audio arrives, then start a Gemini turn ────────
    try:
        while frontend_alive:
            # Wait for the first audio chunk of a new turn
            try:
                first_chunk = await asyncio.wait_for(audio_queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue  # just check frontend_alive again

            if not frontend_alive:
                break

            # Run the full Gemini turn (blocks until turn_complete or disconnect)
            await run_gemini_turn(first_chunk)

    finally:
        browser_task.cancel()
        session.is_active = False
        active_sessions.pop(session_id, None)
        print(f"[WS] Session ended: {session_id}")

# ==========================================
# REST ENDPOINTS
# ==========================================

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "Prospera Voice Agent",
        "workflow": "START -> Voice Agent -> [conditional] -> Tool -> Voice Agent -> END",
        "active_sessions": len(active_sessions),
        "gemini_configured": bool(API_KEY),
    }


@app.get("/")
async def root():
    return {
        "service": "Prospera Voice Agent",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "websocket": "/api/ws/voice",
            "health": "/api/health",
        },
    }

# ==========================================
# STARTUP
# ==========================================

@app.on_event("startup")
async def startup():
    print("\n" + "=" * 60)
    print("  PROSPERA VOICE AGENT")
    print("=" * 60)
    print("  Workflow: START -> Voice Agent -> [conditional] -> Tool -> Voice Agent -> END")
    print(f"  Model: gemini-2.5-flash-native-audio")
    print(f"  Voice: Fenrir")
    print(f"  Tools: web_search, get_circle_info, get_platform_stats")
    print(f"  Port: 8002")
    print(f"  Gemini Key: {'configured' if API_KEY else 'MISSING'}")
    print(f"  Serper Key: {'configured' if SERPER_API_KEY else 'MISSING'}")
    print("=" * 60 + "\n")
    await get_workflow()

# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
