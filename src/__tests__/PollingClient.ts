import { JSONFetcher } from '../JSONFetcher';
import { PollingClient } from '../PollingClient';

jest.mock('../JSONFetcher');

const pollInterval = 1000;

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
});

describe('PollingClient', () => {
  describe('constructor', () => {
    test('defaults', () => {
      const client = new PollingClient({
        endpoint: 'http://example.com',
      });

      expect(client).toBeInstanceOf(PollingClient);
      expect(JSONFetcher).toHaveBeenCalledTimes(1);
      expect(JSONFetcher).toHaveBeenCalledWith('http://example.com', {
        timeout: 60000,
      });
    });

    test('with pollInterval', () => {
      const client = new PollingClient({
        endpoint: 'http://example.com',
        pollInterval: 5000,
      });

      expect(client).toBeInstanceOf(PollingClient);
      expect(JSONFetcher).toHaveBeenCalledTimes(1);
      expect(JSONFetcher).toHaveBeenCalledWith('http://example.com', {
        timeout: 5000,
      });
    });
  });

  describe('startRefreshing', () => {
    let client: PollingClient;
    let fetcher: JSONFetcher<any>;

    beforeEach(() => {
      fetcher = new JSONFetcher('');
      client = new PollingClient({
        fetcher,
        endpoint: 'http://example.com',
      });
    });

    test('interval', () => {
      (fetcher.fetch as jest.Mock).mockResolvedValue({ hello: 1 });

      client.startRefreshing();
      expect(clearInterval).not.toBeCalled();
      expect(setInterval).toBeCalledWith(expect.any(Function), 60000);
    });
  });

  describe('getValue', () => {
    let client: PollingClient;
    let fetcher: JSONFetcher<any>;

    beforeEach(() => {
      fetcher = new JSONFetcher('');
      client = new PollingClient({
        fetcher,
        endpoint: 'http://example.com',
        pollInterval,
      });
    });

    afterEach(() => {
      client.stopRefreshing();
    });

    describe('single invocation', () => {
      it('fetches the data', (done) => {
        (fetcher.fetch as jest.Mock).mockResolvedValue({ hello: 1 });

        client.startRefreshing();

        client.getValue((err, result) => {
          expect(err).toBeNull();
          expect(result).toEqual({ hello: 1 });

          expect(fetcher.fetch).toHaveBeenCalledTimes(1);

          done();
        });
      });
    });

    describe('error', () => {
      it('restores after single error', (done) => {
        (fetcher.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('something went wrong'))
          .mockResolvedValueOnce({ hello: 1 });

        client.startRefreshing();

        client.getValue((err, result) => {
          expect(err).toEqual(new Error('something went wrong'));
          expect(result).toBeNull();

          expect(fetcher.fetch).toHaveBeenCalledTimes(1);

          client.getValue((err2, result2) => {
            expect(err2).toBeNull();
            expect(result2).toEqual({ hello: 1 });

            expect(fetcher.fetch).toHaveBeenCalledTimes(2);

            done();
          });
        });
      });

      it('returns cached data', (done) => {
        (fetcher.fetch as jest.Mock)
          .mockResolvedValueOnce({ hello: 1 })
          .mockRejectedValueOnce(new Error('something went wrong'))
          .mockResolvedValue({ hello: 2 });

        client.startRefreshing();

        client.getValue((err, result) => {
          expect(err).toBeNull();
          expect(result).toEqual({ hello: 1 });

          expect(fetcher.fetch).toHaveBeenCalledTimes(1);

          jest.runTimersToTime(pollInterval);

          client.getValue((err2, result2) => {
            expect(err2).toBeNull();
            expect(result2).toEqual({ hello: 1 });

            expect(fetcher.fetch).toHaveBeenCalledTimes(2);

            done();
          });
        });
      });
    });

    describe('sequential invocation', () => {
      it('uses the cache', async (done) => {
        (fetcher.fetch as jest.Mock).mockResolvedValue({ hello: 1 });

        client.startRefreshing();

        client.getValue((err, result) => {
          expect(err).toBeNull();
          expect(result).toEqual({ hello: 1 });

          expect(fetcher.fetch).toHaveBeenCalledTimes(1);

          client.getValue((err2, result2) => {
            expect(err2).toBeNull();
            expect(result2).toEqual({ hello: 1 });

            expect(fetcher.fetch).toHaveBeenCalledTimes(1);

            jest.runTimersToTime(pollInterval);

            expect(fetcher.fetch).toHaveBeenCalledTimes(2);

            done();
          });
        });
      });
    });

    describe('concurrent invocations', () => {
      it('fetches only once', async () => {
        (fetcher.fetch as jest.Mock).mockResolvedValue({ hello: 1 });

        await Promise.all([
          new Promise((resolve) => {
            client.getValue((err, result) => {
              expect(err).toBeNull();
              expect(result).toEqual({ hello: 1 });

              resolve();
            });
          }),
          new Promise((resolve) => {
            client.getValue((err, result) => {
              expect(err).toBeNull();
              expect(result).toEqual({ hello: 1 });

              resolve();
            });
          }),
          new Promise((resolve) => {
            client.getValue((err, result) => {
              expect(err).toBeNull();
              expect(result).toEqual({ hello: 1 });

              resolve();
            });
          }),
        ]);

        expect(fetcher.fetch).toHaveBeenCalledTimes(3);
      });
    });
  });
});
