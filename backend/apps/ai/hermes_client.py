import requests
import json
from django.conf import settings

class HermesClient:
    """Client for calling Hermes LLM on local VM"""

    def __init__(self):
        self.hermes_url = "http://192.168.1.23:5000/v1"
        self.ollama_url = "http://192.168.1.10:30068/v1"  # TrueNAS fallback
        self.model = "hermes2"  # Default model
        self.timeout = 30

    def _call_hermes(self, prompt: str) -> str:
        """Call Hermes endpoint"""
        try:
            response = requests.post(
                f"{self.hermes_url}/completions",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()['choices'][0]['text'].strip()
        except requests.exceptions.RequestException as e:
            print(f"Hermes error: {e}, trying Ollama fallback...")
            return self._call_ollama(prompt)

    def _call_ollama(self, prompt: str) -> str:
        """Fallback to Ollama on TrueNAS"""
        try:
            response = requests.post(
                f"{self.ollama_url}/completions",
                json={
                    "model": "hermes2",
                    "prompt": prompt,
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()['choices'][0]['text'].strip()
        except requests.exceptions.RequestException as e:
            print(f"Ollama fallback failed: {e}")
            return ""

    def generate_description(self, instance_data: dict) -> str:
        """Generate description for instance"""
        data_str = json.dumps(instance_data, indent=2)
        prompt = f"""Based on this data, write a brief one-line description:

{data_str}

Description:"""
        return self._call_hermes(prompt)

    def generate_tags(self, instance_data: dict, thing_name: str) -> list:
        """Generate tags for instance"""
        data_str = json.dumps(instance_data, indent=2)
        prompt = f"""Based on this {thing_name} data, suggest 3-5 relevant tags (comma-separated):

{data_str}

Tags:"""
        response = self._call_hermes(prompt)
        tags = [tag.strip() for tag in response.split(',')]
        return tags[:5]

    def generate_summary(self, instance_data: dict) -> str:
        """Generate summary for instance"""
        data_str = json.dumps(instance_data, indent=2)
        prompt = f"""Summarize this data in 2-3 sentences:

{data_str}

Summary:"""
        return self._call_hermes(prompt)

hermes = HermesClient()
