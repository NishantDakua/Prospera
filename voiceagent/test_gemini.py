import asyncio, json, websockets, time

async def test():
    API_KEY = "AIzaSyDA4ISu85r1DjaZ5xolZECOdLSbyHLo1eU"
    url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={API_KEY}"
    
    async with websockets.connect(url) as ws:
        setup = {
            "setup": {
                "model": "models/gemini-2.5-flash-native-audio-latest",
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
                    "parts": [{"text": "You are a helpful assistant. Say hello when greeted."}]
                },
            }
        }
        await ws.send(json.dumps(setup))
        setup_resp = await ws.recv()
        print("Setup resp:", json.dumps(json.loads(setup_resp), indent=2)[:300])
        
        # Send a text message
        await ws.send(json.dumps({
            "clientContent": {
                "turns": [{"role": "user", "parts": [{"text": "Hello, say hi back in one sentence"}]}],
                "turnComplete": True,
            }
        }))
        
        # Read responses
        start = time.time()
        while time.time() - start < 15:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                resp = json.loads(msg)
                keys = list(resp.keys())
                print(f"\nResponse keys: {keys}")
                if "serverContent" in resp:
                    sc = resp["serverContent"]
                    print(f"  serverContent keys: {list(sc.keys())}")
                    if "modelTurn" in sc:
                        parts = sc["modelTurn"].get("parts", [])
                        for p in parts:
                            if "inlineData" in p:
                                mime = p["inlineData"].get("mimeType", "?")
                                data_len = len(p["inlineData"].get("data", ""))
                                print(f"  Audio chunk: mime={mime}, data_len={data_len}")
                            elif "text" in p:
                                print(f"  Text: {p['text'][:200]}")
                    if "outputTranscription" in sc:
                        print(f"  outputTranscription: {sc['outputTranscription']}")
                    if "inputTranscription" in sc:
                        print(f"  inputTranscription: {sc['inputTranscription']}")
                    if sc.get("turnComplete"):
                        print("  TURN COMPLETE")
                        break
                else:
                    print(f"  Full: {str(resp)[:400]}")
            except asyncio.TimeoutError:
                print("No message in 5s, stopping")
                break

asyncio.run(test())
