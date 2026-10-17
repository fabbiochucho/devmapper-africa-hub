# Project architecture rules

- Keep vendor chunk assignment function-based and match complete package names, because Vite 8/Rolldown does not support object-form `manualChunks` and prefix matches can misclassify dependencies.