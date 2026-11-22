"""
Command line entry point:

    uv run apilog            # or: python -m app

Set HOST and PORT to change the address. The default host is 127.0.0.1,
because the app has no login. HOST=0.0.0.0 makes it reachable in your local
network (for example from a phone), and then everyone in that network can
read and change the data.
"""
import os

import uvicorn


def main() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    if host not in ("127.0.0.1", "localhost"):
        print(
            "Warning: the server is reachable from the network and the app has "
            "no login. Anyone in this network can read and change the data."
        )
    print(f"ApiLog is running on http://{host}:{port} (press Ctrl+C to stop)")
    uvicorn.run("app.main:app", host=host, port=port)


if __name__ == "__main__":
    main()
