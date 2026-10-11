let runtimeHandlers = null

export const configureTargetAuthRuntime = handlers => {
    runtimeHandlers = handlers

    return () => {
        if (runtimeHandlers === handlers) {
            runtimeHandlers = null
        }
    }
}

export const getValidTargetAccessToken = async () => (
    runtimeHandlers?.getValidAccessToken?.() ?? null
)

export const recoverTargetAuthentication = async () => {
    if (!runtimeHandlers?.recoverUnauthorized) {
        return null
    }

    return runtimeHandlers.recoverUnauthorized()
}

export const notifyTargetSessionExpired = async () => {
    await runtimeHandlers?.onSessionExpired?.()
}

export const resetTargetAuthRuntime = () => {
    runtimeHandlers = null
}
