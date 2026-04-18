"""
logger.py
Daily-rotating log system for the FastAPI backend.

One file per calendar day: logs/YYYY-MM-DD.log
File handler: INFO+  (full detail on disk)
Console handler: WARNING+  (clean terminal output)
Noisy third-party loggers suppressed to WARNING.
"""

import logging
import logging.handlers
import time
from datetime import datetime
from pathlib import Path

_LOGS_DIR = Path(__file__).parent / "logs"
_LOGS_DIR.mkdir(exist_ok=True)

_BACKUP_DAYS = 90


class _DailyFileHandler(logging.handlers.TimedRotatingFileHandler):
    """
    Rotating file handler that names each file YYYY-MM-DD.log.

    Standard TimedRotatingFileHandler renames the old file at rollover.
    This subclass instead updates baseFilename to the new date so the
    current file always carries today's date — no renaming needed.
    """

    def __init__(self, log_dir: Path, backup_count: int = _BACKUP_DAYS) -> None:
        self.log_dir = log_dir
        today = datetime.now().strftime("%Y-%m-%d")
        super().__init__(
            filename=str(log_dir / f"{today}.log"),
            when="midnight",
            interval=1,
            backupCount=backup_count,
            encoding="utf-8",
            delay=False,
            utc=False,
        )

    def doRollover(self) -> None:
        # Flush and close the current day's file (it keeps its YYYY-MM-DD.log name)
        if self.stream:
            self.stream.flush()
            self.stream.close()
            self.stream = None  # type: ignore[assignment]

        # Point to the new day's file
        new_date = datetime.now().strftime("%Y-%m-%d")
        self.baseFilename = str(self.log_dir / f"{new_date}.log")
        self.rolloverAt = self.computeRollover(int(time.time()))

        # Prune oldest files beyond backup_count
        if self.backupCount > 0:
            log_files = sorted(self.log_dir.glob("????-??-??.log"))
            while len(log_files) >= self.backupCount:
                log_files[0].unlink(missing_ok=True)
                log_files = log_files[1:]

        self.stream = self._open()


_LOG_FORMAT = "%(asctime)s [%(levelname)-8s] %(name)s - %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

_setup_done = False


def setup_logging() -> None:
    """
    Configure the root logger once.

    Call once at application startup (from main.py lifespan or module level).
    Safe to call multiple times — subsequent calls are no-ops.
    """
    global _setup_done
    if _setup_done:
        return
    _setup_done = True

    formatter = logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT)

    # File handler — INFO and above
    file_handler = _DailyFileHandler(_LOGS_DIR, backup_count=_BACKUP_DAYS)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # Console handler — WARNING and above (keep terminal clean)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    root.addHandler(file_handler)
    root.addHandler(console_handler)

    # Suppress noisy third-party loggers
    for noisy in ("httpx", "httpcore", "google", "urllib3", "multipart",
                  "uvicorn.access", "moviepy"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger(__name__).info("Logging initialised — writing to %s", _LOGS_DIR)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger. Call after setup_logging() has been called."""
    return logging.getLogger(name)
