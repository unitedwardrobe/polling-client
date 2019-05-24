import { JSONFetcher } from './JSONFetcher';

export interface ClientOptions<T = any> {
  endpoint: string;
  pollInterval?: number;
  fetcher?: JSONFetcher<T>;
}

export class PollingClient<T = any> {
  public endpoint: string;
  public pollInterval: number;
  public cache: T;
  private timeout: NodeJS.Timeout;
  private fetcher: JSONFetcher<T>;

  constructor({ endpoint, pollInterval, fetcher }: ClientOptions<T>) {
    this.endpoint = endpoint;
    this.pollInterval = pollInterval || 60 * 1000;
    this.fetcher =
      fetcher ||
      new JSONFetcher(endpoint, {
        timeout: this.pollInterval,
      });
  }

  /**
   * Starts refreshing on an interval
   */
  public startRefreshing() {
    this.timeout = setInterval(() => {
      this.refresh().catch((err) => {
        // ignore for now
      });
    }, this.pollInterval);
  }

  /**
   * Stop refreshing, if it was started
   */
  public stopRefreshing() {
    if (this.timeout) {
      clearInterval(this.timeout);
    }
  }

  /**
   * This method retrieves the value and calls the callback. If the value was
   * already cached, that value is returned, otherwise the function waits for
   * the fetcher to complete and then returns the result.
   *
   * @param callback completion method
   */
  public getValue(callback: (error: Error | null, result: T) => void) {
    if (this.cache) {
      callback(null, this.cache);
    } else {
      this.refresh()
        .then((result) => {
          callback(null, result);
        })
        .catch((err) => {
          callback(err, null);
        });
    }
  }

  private async refresh() {
    return this.fetcher.fetch().then((res) => {
      this.cache = res;
      return res;
    });
  }
}
