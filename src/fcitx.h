#pragma once
#include <fcitx/instance.h>

namespace fcitx {
enum class Runtime {
    web = 0,
    webworker = 1,
    serviceworker = 2, // ChromeOS
    options = 3,       // ChromeOS
};

extern std::unique_ptr<Instance> instance;
extern Runtime runtime;
} // namespace fcitx
