import { JSONFetcher } from '../JSONFetcher';
import fetch from 'node-fetch';
const { Response } = jest.requireActual('node-fetch');

jest.mock('node-fetch');
jest.useFakeTimers();

beforeEach(() => {
  jest.resetAllMocks();
});

describe('JSONFetcher', () => {
  let fetcher: JSONFetcher<any>;
  beforeEach(() => {
    fetcher = new JSONFetcher('http://example.com/data.json', {
      headers: {
        authorization: 'Basic abc',
      },
    });
  });
  describe('fetch', () => {
    test('single invocation', async () => {
      ((fetch as any) as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ hello: 1 }))
      );

      await expect(fetcher.fetch()).resolves.toEqual({ hello: 1 });

      expect(fetch).lastCalledWith('http://example.com/data.json', {
        headers: {
          authorization: 'Basic abc',
        },
      });
    });

    describe('sequential invocation', () => {
      it('fetches multiple times', async () => {
        ((fetch as any) as jest.Mock)
          .mockResolvedValueOnce(new Response(JSON.stringify({ hello: 1 })))
          .mockResolvedValueOnce(new Response(JSON.stringify({ hello: 2 })));

        await expect(fetcher.fetch()).resolves.toEqual({ hello: 1 });
        await expect(fetcher.fetch()).resolves.toEqual({ hello: 2 });

        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('concurrent invocations', () => {
      it('fetches only once', async () => {
        ((fetch as any) as jest.Mock).mockResolvedValueOnce(
          new Response(JSON.stringify({ hello: 1 }))
        );

        await Promise.all([
          expect(fetcher.fetch()).resolves.toEqual({ hello: 1 }),
          expect(fetcher.fetch()).resolves.toEqual({ hello: 1 }),
          expect(fetcher.fetch()).resolves.toEqual({ hello: 1 }),
        ]);

        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
