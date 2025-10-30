// @flow

type ApiResult =
    | { ok: true, data: string }
    | { ok: false, error: string };

function getLength(result: ApiResult): number {
    if (result.ok === true) {
        return result.data.length;
    }
    // Intentional error: missing exhaustive branch handling if shape changes
    // $FlowExpectedError[prop-missing]
    return result.data.length;
}

// Correct exhaustive refinement example
function getMessage(result: ApiResult): string {
    return result.ok ? result.data : result.error;
}

console.log(getMessage({ ok: true, data: 'hello' }));
