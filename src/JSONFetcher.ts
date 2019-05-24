import fetch, { RequestInfo, RequestInit } from 'node-fetch';

export class JSONFetcher<T> {
  private fetchPromise: Promise<T>;
  private info: RequestInfo;
  private init: RequestInit;

  constructor(info: RequestInfo, init?: RequestInit) {
    this.info = info;
    this.init = init;
  }

  public async fetch() {
    if (!this.fetchPromise) {
      this.fetchPromise = new Promise(async (resolve) => {
        const res = await fetch(this.info, this.init);
        const body = await res.json();

        resolve(body);

        this.fetchPromise = null;
      });
    }
    return this.fetchPromise;
  }
}
