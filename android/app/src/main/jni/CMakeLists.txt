cmake_minimum_required(VERSION 3.13)

project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Required for Android 15+ devices/emulators with 16KB memory pages.
# Without this flag, ELF segments in libappmodules.so are aligned to 4KB,
# which causes incorrect memory mappings on 16K-page kernels and leads to
# pointer corruption crashes during Fabric component descriptor initialization.
target_link_options(${CMAKE_PROJECT_NAME} PRIVATE -Wl,-z,max-page-size=16384)
