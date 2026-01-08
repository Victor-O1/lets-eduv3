let interval: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e) => {
  if (e.data === "start") {
    interval = setInterval(() => {
      self.postMessage(Date.now());
    }, 1000);
  }

  if (e.data === "stop" && interval) {
    clearInterval(interval);
    interval = null;
  }
};
