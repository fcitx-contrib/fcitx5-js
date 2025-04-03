#pragma once

#include <fcitx-utils/eventloopinterface.h>

namespace fcitx {
class JSEventLoop : public EventLoopInterfaceV2 {
  public:
    JSEventLoop() = default;
    ~JSEventLoop() override = default;
    bool exec() override { return true; }
    void exit() override {}
    const char *implementation() const override { return "js"; }
    void *nativeHandle() override { return nullptr; }

    std::unique_ptr<EventSourceIO> addIOEvent(int fd, IOEventFlags flags,
                                              IOCallback callback) override;
    std::unique_ptr<EventSourceTime>
    addTimeEvent(clockid_t clock, uint64_t usec, uint64_t accuracy,
                 TimeCallback callback) override;
    std::unique_ptr<EventSource> addExitEvent(EventCallback callback) override;
    std::unique_ptr<EventSource> addDeferEvent(EventCallback callback) override;
    std::unique_ptr<EventSource> addPostEvent(EventCallback callback) override;
    std::unique_ptr<EventSourceAsync>
    addAsyncEvent(EventCallback callback) override;
};
} // namespace fcitx
