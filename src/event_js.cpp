#include "event_js.h"
#include <emscripten.h>
#include <fcitx-utils/event_p.h>
#include <fcitx-utils/log.h>

namespace fcitx {

template <typename Interface> struct JSEventSourceBase : public Interface {
  public:
    ~JSEventSourceBase() override {}

    bool isEnabled() const override { return enabled_; }

    void setEnabled(bool enabled) override { enabled_ = enabled; }

    bool isOneShot() const override { return oneShot_; }

    void setOneShot() override { oneShot_ = true; }

  private:
    bool enabled_ = false;
    bool oneShot_ = false;
};

struct JSEventSource : public JSEventSourceBase<EventSource> {
    JSEventSource(EventCallback _callback)
        : callback_(std::make_shared<EventCallback>(std::move(_callback))) {}

    std::shared_ptr<EventCallback> callback_;
};

struct JSEventSourceIO : public JSEventSourceBase<EventSourceIO> {
    JSEventSourceIO(IOCallback _callback) {}

    int fd() const override { return 0; }

    void setFd(int fd) override {}

    IOEventFlags events() const override { return IOEventFlag::In; }

    void setEvents(IOEventFlags flags) override {}

    IOEventFlags revents() const override { return IOEventFlag::In; }
};

void TimeEventCallback(void *arg);

struct JSEventSourceTime : public JSEventSourceBase<EventSourceTime> {
    JSEventSourceTime(TimeCallback _callback, uint64_t time, clockid_t clockid)
        : callback_(std::make_shared<TimeCallback>(std::move(_callback))),
          time_(time), clockid_(clockid) {
        setOneShot();
    }

    void setOneShot() override {
        int t = std::max<int64_t>(0, time_ - now(CLOCK_MONOTONIC)) / 1000;
        emscripten_async_call(TimeEventCallback, this, t);
    }

    uint64_t time() const override { return time_; }

    void setTime(uint64_t time) override { time_ = time; }

    uint64_t accuracy() const override { return 0; }

    void setAccuracy(uint64_t time) override {}

    clockid_t clock() const override { return clockid_; }

    std::shared_ptr<TimeCallback> callback_;

  private:
    uint64_t time_;
    clockid_t clockid_;
};

void TimeEventCallback(void *arg) {
    auto source = static_cast<JSEventSourceTime *>(arg);
    (*source->callback_)(source, source->time());
}

std::unique_ptr<EventSourceIO>
JSEventLoop::addIOEvent(int fd, IOEventFlags flags, IOCallback callback) {
    auto source = std::make_unique<JSEventSourceIO>(std::move(callback));
    return source;
}

std::unique_ptr<EventSourceTime>
JSEventLoop::addTimeEvent(clockid_t clock, uint64_t usec, uint64_t accuracy,
                          TimeCallback callback) {
    auto source =
        std::make_unique<JSEventSourceTime>(std::move(callback), usec, clock);
    return source;
}

std::unique_ptr<EventSource> JSEventLoop::addExitEvent(EventCallback callback) {
    auto source = std::make_unique<JSEventSource>(std::move(callback));
    return source;
}

std::unique_ptr<EventSource>
JSEventLoop::addDeferEvent(EventCallback callback) {
    return addTimeEvent(
        CLOCK_MONOTONIC, now(CLOCK_MONOTONIC), 0,
        [callback = std::move(callback)](EventSourceTime *source, uint64_t) {
            return callback(source);
        });
}

std::unique_ptr<EventSource> JSEventLoop::addPostEvent(EventCallback callback) {
    FCITX_ERROR() << "Not implemented";
    return nullptr;
}

} // namespace fcitx
