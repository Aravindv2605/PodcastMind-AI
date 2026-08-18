import sys
sys.path.insert(0, r'C:\Projects\FINAL_CAPGEMINI\FINAL_CAPGEMINI\capgemini (2)\capgemini (2)\capgemini\backend')
import asyncio
from app.ai.openai_client import openai_wrapper

async def test():
    try:
        print('active:', openai_wrapper.is_active)
        res = await openai_wrapper.generate_response('sys','Hello from debug test')
        print('RES:', res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
