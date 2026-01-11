#include <fcitx-utils/log.h>
#include <pthread.h>

extern "C" {
// emscripten's default implementation just returns EAGAIN, which means we have
// to patch every library that spawns threads. Fortunately it's just a weak
// alias so we override it to be a direct function call. For threads that has
// more complicated usages, e.g. in leveldb a while loop that accepts tasks,
// we still have to patch manually.
int pthread_create(pthread_t *thread, const pthread_attr_t *attr,
                   void *(*start_routine)(void *), void *arg) {
    static unsigned long id = 0;
    *thread = (pthread_t)++id;
    FCITX_DEBUG() << "Starting thread " << id;
    start_routine(arg);
    FCITX_DEBUG() << "Thread " << id << " finished";
    return 0;
}

int pthread_join(pthread_t thread, void **retval) {
    FCITX_DEBUG() << "Joining thread " << (unsigned long)thread;
    return 0;
}
}
