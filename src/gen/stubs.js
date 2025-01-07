function fetchJS(url, opts) {
    const res = fetch_inbuilt.applySyncPromise(
        undefined,
        [url, new ivm.ExternalCopy(opts).copyInto()]
    );
    return res;
}