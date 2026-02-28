from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Simple conversation buffer
conversation_history = []

# Lazy load heavy dependencies only when needed
db = None
llm = None

def get_llm():
    global llm
    if llm is None:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            api_key="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",
            base_url="https://openrouter.ai/api/v1",
            model="openai/gpt-3.5-turbo"
        )
    return llm

def get_db():
    global db
    if db is None:
        print("⚠ VectorDB disabled - chatbot will work without RAG context")
        # Uncomment below when vectordb is ready
        # try:
        #     from langchain_community.vectorstores import Chroma
        #     from langchain_community.embeddings import HuggingFaceEmbeddings
        #     
        #     BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        #     VECTORDB_PATH = os.path.join(BASE_DIR, "..", "vectordb")
        #     
        #     if os.path.exists(VECTORDB_PATH):
        #         embeddings = HuggingFaceEmbeddings()
        #         db = Chroma(
        #             persist_directory=VECTORDB_PATH,
        #             embedding_function=embeddings
        #         )
        #         print(f"✓ Loaded vectordb from {VECTORDB_PATH}")
        #     else:
        #         print(f"⚠ Warning: vectordb not found at {VECTORDB_PATH}")
        #         print("  The chatbot will work without RAG context.")
        # except Exception as e:
        #     print(f"⚠ Warning: Could not load vectordb: {e}")
        #     print("  The chatbot will work without RAG context.")
    return db


@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.json
        if not data or "question" not in data:
            return jsonify({"error": "Missing 'question' in request body"}), 400

        query = data["question"]
        
        # Try to get context from vectordb if available
        context = ""
        vector_db = get_db()
        if vector_db:
            try:
                docs = vector_db.similarity_search(query, k=3)
                context = " ".join([d.page_content for d in docs])
            except Exception as e:
                print(f"⚠ Warning: Could not search vectordb: {e}")

        # Build chat history from buffer
        chat_history = "\n".join(
            [f"Q: {item['input']}\nA: {item['output']}" for item in conversation_history]
        )

        prompt = f"""
You are CircleSave AI, a premium fintech assistant for a Web3 collaborative savings platform called Prospera.
You help users understand chit funds, savings circles, bidding, trust scores, and platform features.
Keep responses concise (under 120 words), professional, and helpful.
Use ₹ for currency. Format numbers with commas for readability.

KEY PLATFORM FACTS:
- Prospera charges a 10% platform fee on each transaction/payout
- This fee is transparently disclosed in the Smart Contract before joining any Circle
- The fee funds platform operations, smart contract security, Elite Payouts, and the Trust Score system

Previous Conversation:
{chat_history}

Context:
{context}

User Question:
{query}
"""

        llm_instance = get_llm()
        response = llm_instance.invoke(prompt)

        # Store conversation in buffer
        conversation_history.append({
            "input": query,
            "output": response.content
        })

        return jsonify({"answer": response.content})
    except Exception as e:
        import traceback
        print(f"❌ Error in /ask endpoint: {e}")
        traceback.print_exc()
        return jsonify({"answer": f"Sorry, I encountered an error: {str(e)}"}), 500


@app.route("/advice", methods=["GET", "POST"])
def financial_advice():
    # If request from browser URL
    if request.method == "GET":
        amount = request.args.get("amount")
        purpose = request.args.get("purpose")
    # If request from API / frontend
    else:
        data = request.json or {}
        amount = data.get("amount")
        purpose = data.get("purpose")

    if not amount or not purpose:
        return jsonify({"error": "Please provide amount and purpose"}), 400

    prompt = f"""
You are CircleSave AI, a premium fintech advisor for Prospera.

User details:
- Available amount: ₹{amount}
- Purpose: {purpose}

Give personalized financial advice.
Suggest saving, investing, or loan options.
Explain risks.
Keep response simple and actionable.
Keep response under 150 words.
"""

    llm_instance = get_llm()
    response = llm_instance.invoke(prompt)

    return jsonify({"advice": response.content})


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🤖 CircleSave AI Backend Starting...")
    print("="*60)
    print("✓ Flask server initializing")
    print("✓ Lazy loading: LLM and VectorDB will load on first request")
    print("="*60 + "\n")
    app.run(debug=True, port=5000)
