import logging
import asyncio
import importlib

# Prefer the modern package if available, otherwise try the legacy client.
genai = None
for pkg_name in ("google.genai", "google.generativeai"):
    try:
        genai = importlib.import_module(pkg_name)
        break
    except Exception:
        genai = None
from app.utils.config import settings

logger = logging.getLogger("app.gemini")


class OpenAIClientWrapper:
    """Backward-compatible wrapper that uses Google Gemini (google-generativeai) under the hood.
    The object is still exposed as `openai_wrapper` so existing callers don't need to change.
    """
    def __init__(self):
        self.client = None
        self.is_active = False
        self.initialize()

    def initialize(self):
        key = getattr(settings, "GEMINI_API_KEY", None)
        if genai and key and key != "your-gemini-api-key-here" and not key.startswith("your-"):
            try:
                genai.configure(api_key=key)
                self.client = genai
                self.is_active = True
                logger.info("Gemini client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                self.is_active = False
        else:
            logger.warning("GEMINI_API_KEY is not set or google-generativeai not installed. Gemini client disabled.")
            self.is_active = False

    def create_embeddings(self, texts: list, model_name: str = None) -> list:
        if not self.is_active or not self.client:
            raise RuntimeError(
                "Gemini client is not configured. Set GEMINI_API_KEY in the environment and install google-generativeai/google.genai."
            )

        model_name = model_name or getattr(settings, "GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")

        def embed_single(text: str):
            if hasattr(self.client, "embed_content"):
                try:
                    return self.client.embed_content(
                        model=model_name,
                        content=text,
                        task_type="retrieval_document",
                    )
                except TypeError:
                    return self.client.embed_content(model=model_name, content=text)
            raise RuntimeError("No supported embedding entrypoint found on Gemini client.")

        def call_embeddings():
            if hasattr(self.client, "embeddings") and hasattr(self.client.embeddings, "create"):
                return self.client.embeddings.create(model=model_name, input=texts)

            if hasattr(self.client, "Embeddings") and hasattr(self.client.Embeddings, "create"):
                return self.client.Embeddings.create(model=model_name, input=texts)

            if hasattr(self.client, "embed") and callable(getattr(self.client, "embed")):
                return self.client.embed(model=model_name, input=texts)

            if hasattr(self.client, "embed_content"):
                return [embed_single(text) for text in texts]

            raise RuntimeError("No supported embedding entrypoint found on Gemini client.")

        loop = asyncio.get_event_loop()
        response = loop.run_in_executor(None, call_embeddings)
        response = response if not hasattr(response, "result") else response.result()

        embeddings = []
        try:
            items = response if isinstance(response, list) else [response]
            for item in items:
                if isinstance(item, dict) and "embedding" in item:
                    embeddings.append(item["embedding"])
                elif hasattr(item, "embedding"):
                    embeddings.append(item.embedding)
                elif isinstance(item, dict):
                    data = item.get("data") or item.get("embeddings")
                    if isinstance(data, list):
                        for entry in data:
                            if isinstance(entry, dict) and "embedding" in entry:
                                embeddings.append(entry["embedding"])
                            elif hasattr(entry, "embedding"):
                                embeddings.append(entry.embedding)
            if not embeddings and hasattr(response, "data"):
                for item in response.data:
                    if hasattr(item, "embedding"):
                        embeddings.append(item.embedding)
            if not embeddings and hasattr(response, "embedding"):
                embeddings.append(response.embedding)
        except Exception:
            pass

        if not embeddings:
            raise RuntimeError("Failed to parse embeddings response from Gemini client.")

        return embeddings

    def _resolve_model_object(self, model_name: str):
        """Try to resolve a concrete Model object from the SDK given a friendly name.
        Returns model object or None if not resolvable.
        """
        if not model_name:
            return None

        # Prefer constructing a GenerativeModel object if available (ChatSession expects this type)
        try:
            if hasattr(self.client, "GenerativeModel"):
                try:
                    return self.client.GenerativeModel(model_name)
                except Exception:
                    pass

            # Fallback: try get_model/list_models to find a named model resource, but avoid returning raw Model objects
            if hasattr(self.client, "list_models"):
                try:
                    models = self.client.list_models()
                except Exception:
                    models = None

                if models:
                    candidates = []
                    if isinstance(models, dict):
                        candidates = models.get("models") or models.get("data") or []
                    else:
                        try:
                            candidates = list(models)
                        except Exception:
                            candidates = []

                    target = model_name.lower()
                    for m in candidates:
                        try:
                            mname = getattr(m, "name", None) or (m.get("name") if isinstance(m, dict) else None)
                            disp = getattr(m, "display_name", None) or (m.get("display_name") if isinstance(m, dict) else None)
                            if mname and (target in mname.lower() or target in (disp or "").lower()):
                                # Try to build a GenerativeModel from the resource name
                                if hasattr(self.client, "GenerativeModel"):
                                    try:
                                        return self.client.GenerativeModel(mname)
                                    except Exception:
                                        pass
                                # As a final fallback, try get_model but don't return raw Model unless necessary
                                try:
                                    return self.client.get_model(mname)
                                except Exception:
                                    continue
                        except Exception:
                            continue
        except Exception:
            return None

        return None

    async def generate_response(self, system_prompt: str, user_message: str, chat_history: list = None, temperature: float = 0.7) -> str:
        """Generates a conversational response via Gemini."""
        if not self.is_active or not self.client:
            raise RuntimeError(
                "Gemini client is not configured. Set GEMINI_API_KEY in the environment and install google-generativeai/google.genai."
            )

        try:
            loop = asyncio.get_event_loop()
            model_name = getattr(settings, "GEMINI_MODEL", "models/gemini-2.5-flash")

            def call_chat():
                if hasattr(self.client, "GenerativeModel"):
                    generation_config = {"temperature": temperature}
                    if hasattr(self.client, "types") and hasattr(self.client.types, "GenerationConfig"):
                        generation_config = self.client.types.GenerationConfig(temperature=temperature)

                    model = self.client.GenerativeModel(
                        model_name=model_name,
                        system_instruction=system_prompt or None,
                        generation_config=generation_config,
                    )

                    contents = []
                    if chat_history:
                        for msg in chat_history[-4:]:
                            role = "user" if msg.get("role") == "user" else "model"
                            contents.append({"role": role, "parts": [msg.get("content", "")]})
                    contents.append({"role": "user", "parts": [user_message]})
                    return model.generate_content(contents)

                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                if chat_history:
                    for msg in chat_history[-4:]:
                        role = msg.get("role", "user")
                        messages.append({"role": role, "content": msg.get("content", "")})
                messages.append({"role": "user", "content": user_message})

                if hasattr(self.client, "chat") and hasattr(self.client.chat, "create"):
                    return self.client.chat.create(model=model_name, messages=messages, temperature=temperature)

                if hasattr(self.client, "ChatCompletion") and hasattr(self.client.ChatCompletion, "create"):
                    return self.client.ChatCompletion.create(model=model_name, messages=messages, temperature=temperature)

                raise RuntimeError("No supported chat entrypoint found on Gemini client.")

            response = await loop.run_in_executor(None, call_chat)

            # Parse the response from shared SDK shapes
            text = None
            if isinstance(response, dict):
                text = response.get("output_text") or response.get("text") or response.get("response")
                if not text and "output" in response:
                    output = response["output"]
                    if isinstance(output, list) and output:
                        first = output[0]
                        if isinstance(first, dict):
                            text = first.get("content", [{}])[0].get("text") if first.get("content") else None
                        else:
                            text = str(first)
            else:
                if hasattr(response, "text"):
                    text = response.text
                elif hasattr(response, "output_text"):
                    text = response.output_text
                elif hasattr(response, "response"):
                    text = response.response
                elif hasattr(response, "output"):
                    out = response.output
                    if isinstance(out, list) and out:
                        first = out[0]
                        if hasattr(first, "content"):
                            try:
                                text = first.content[0].text
                            except Exception:
                                text = None
                        elif isinstance(first, dict):
                            text = first.get("content", [{}])[0].get("text")
                    elif isinstance(out, str):
                        text = out
                elif hasattr(response, "last"):
                    out = response.last
                    if isinstance(out, dict):
                        text = out.get("output", [{}])[0].get("content", [{}])[0].get("text")

            if not text:
                text = str(response)

            return text.strip()
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise RuntimeError(
                "Gemini generation failed. Check your GEMINI_API_KEY, model configuration, and the installed Google Gemini SDK package."
            )


# Singleton wrapper kept for backward compatibility
openai_wrapper = OpenAIClientWrapper()
