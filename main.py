import json
import os
import subprocess
import sys
import tempfile
import urllib.request


def load_env(path=".env"):
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip())
    except FileNotFoundError:
        pass


load_env()

API_KEY = os.environ.get("MISTRAL_API_KEY", "")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
API_URL = "https://api.mistral.ai/v1/chat/completions"
ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech"


def chat(prompt: str) -> str:
    if not API_KEY:
        sys.exit("Error: MISTRAL_API_KEY not set. Add it to .env or export it.")

    payload = json.dumps({
        "model": "codestral-latest",
        "messages": [{"role": "user", "content": prompt}],
    }).encode()

    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())

    return data["choices"][0]["message"]["content"]


def speak(text: str, voice_id: str = "JBFqnCBsd6RMkjVDRZzb") -> None:
    if not ELEVENLABS_API_KEY:
        print("Warning: ELEVENLABS_API_KEY not set. Skipping speech.")
        return

    payload = json.dumps({
        "text": text,
        "model_id": "eleven_monolingual_v1",
    }).encode()

    req = urllib.request.Request(
        f"{ELEVENLABS_TTS_URL}/{voice_id}",
        data=payload,
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
    )

    with urllib.request.urlopen(req) as resp:
        audio_data = resp.read()

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(audio_data)
        tmp_path = f.name

    subprocess.run(["afplay", tmp_path])
    os.unlink(tmp_path)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    else:
        prompt = input("Enter your prompt: ")

    response = chat(prompt)
    print(response)
    speak(response)
