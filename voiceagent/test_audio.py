"""Test sending audio to Gemini Live API to diagnose format issues."""
import asyncio, json, websockets, struct, math, base64, time

API_KEY = "AIzaSyDA4ISu85r1DjaZ5xolZECOdLSbyHLo1eU"

def generate_sine_pcm(duration_s=2.0, sample_rate=16000, frequency=440):
    """Generate a sine wave as 16-bit PCM bytes."""
    num_samples = int(duration_s * sample_rate)
    pcm = bytearray()
    for i in range(num_samples):
        sample = math.sin(2.0 * math.pi * frequency * i / sample_rate)
        pcm.extend(struct.pack('<h', int(sample * 32767 * 0.5)))
    return bytes(pcm)

async def test_audio():
    url = (
        f"wss://generativelanguage.googleapis.com/ws/"
        f"google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
        f"?key={API_KEY}"
    )
    
    async with websockets.connect(url) as ws:
        # Setup
        setup = {
            "setup": {
                "model": "models/gemini-2.5-flash-native-audio-latest",
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {"voiceName": "Aoede"}
                        }
                    },
                },
                "systemInstruction": {
                    "parts": [{"text": "You are a helpful assistant. Say hello when you hear audio."}]
                },
            }
        }
        await ws.send(json.dumps(setup))
        setup_resp = await ws.recv()
        print("Setup OK:", json.loads(setup_resp))
        
        # Generate 2 seconds of sine wave to simulate speech-like audio
        pcm_data = generate_sine_pcm(2.0, 16000, 300)
        chunk_size = 4096  # bytes per chunk (2048 samples)
        
        print(f"\nSending {len(pcm_data)} bytes of PCM audio in {len(pcm_data)//chunk_size} chunks...")
        
        for i in range(0, len(pcm_data), chunk_size):
            chunk = pcm_data[i:i+chunk_size]
            b64 = base64.b64encode(chunk).decode('utf-8')
            await ws.send(json.dumps({
                "realtimeInput": {
                    "mediaChunks": [{
                        "data": b64,
                        "mimeType": "audio/pcm;rate=16000",
                    }]
                }
            }))
            await asyncio.sleep(0.128)  # ~real-time pacing
        
        print("Done sending audio. Waiting for Gemini response...")
        
        # Send silence for 2 seconds (to trigger end-of-speech detection)
        silence = b'\x00' * chunk_size
        for _ in range(15):
            b64 = base64.b64encode(silence).decode('utf-8')
            await ws.send(json.dumps({
                "realtimeInput": {
                    "mediaChunks": [{
                        "data": b64,
                        "mimeType": "audio/pcm;rate=16000",
                    }]
                }
            }))
            await asyncio.sleep(0.128)
        
        print("Sent silence, waiting for response...")
        
        # Wait for responses
        start = time.time()
        got_response = False
        while time.time() - start < 15:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                resp = json.loads(msg)
                keys = list(resp.keys())
                print(f"\n  Response keys: {keys}")
                if "serverContent" in resp:
                    sc = resp["serverContent"]
                    print(f"  serverContent keys: {list(sc.keys())}")
                    got_response = True
                    if sc.get("turnComplete"):
                        print("  TURN COMPLETE!")
                        break
                else:
                    print(f"  Other: {str(resp)[:300]}")
            except asyncio.TimeoutError:
                print("  No response in 5 seconds")
                break
        
        if not got_response:
            print("\n*** NO RESPONSE from Gemini to audio input! ***")
            print("Trying text input on same connection...")
            await ws.send(json.dumps({
                "clientContent": {
                    "turns": [{"role": "user", "parts": [{"text": "Hello, say hi"}]}],
                    "turnComplete": True,
                }
            }))
            start = time.time()
            while time.time() - start < 10:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=5)
                    resp = json.loads(msg)
                    keys = list(resp.keys())
                    print(f"\n  Text response keys: {keys}")
                    if "serverContent" in resp:
                        sc = resp["serverContent"]
                        print(f"  serverContent keys: {list(sc.keys())}")
                        if sc.get("turnComplete"):
                            print("  TURN COMPLETE!")
                            break
                except asyncio.TimeoutError:
                    break

asyncio.run(test_audio())
