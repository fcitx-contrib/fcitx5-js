#include <dlfcn.h>
#include <emscripten.h>
#include <fcitx-utils/log.h>
#include <nlohmann/json.hpp>

namespace fcitx {
extern "C" EMSCRIPTEN_KEEPALIVE int cli(const char *command, const char *args) {
    auto func = (int (*)(int, const char **))dlsym(RTLD_DEFAULT, command);
    if (!func) {
        FCITX_ERROR() << "Command not found: " << command;
        return 1;
    }
    auto jsonArgs = nlohmann::json::parse(args);
    std::vector<std::string> stringArray =
        jsonArgs.get<std::vector<std::string>>();

    int argc = stringArray.size() + 1;
    std::vector<const char *> argv;
    argv.reserve(argc + 1);
    argv.push_back(command);
    for (const auto &str : stringArray) {
        argv.push_back(str.c_str());
    }
    argv.push_back(nullptr);

    optind = 1;
    optopt = 0;
    opterr = 1;
    return func(argc, argv.data());
}
} // namespace fcitx
