const fs = require("fs");
const cache = require("./cache");

jest.mock("fs");

describe("cache.js", () => {
  const mockAction = jest.fn().mockResolvedValue("mocked result");
  const cacheFolder = "./cache";
  const cacheFile = `${cacheFolder}/testKey`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("clear", () => {
    it("should delete the cache file if it exists", () => {
      fs.existsSync.mockReturnValue(true);
      cache.clear("testKey");
      expect(fs.unlinkSync).toHaveBeenCalledWith(cacheFile);
    });

    it("should not attempt to delete the cache file if it does not exist", () => {
      fs.existsSync.mockReturnValue(false);
      cache.clear("testKey");
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe("cachePromiseIfNotLocal", () => {
    it("should call action directly if the request is from localhost", async () => {
      const req = { connection: { remoteAddress: "127.0.0.1" } };
      const options = { action: mockAction };
      const result = await cache.cachePromiseIfNotLocal(options, req);
      expect(mockAction).toHaveBeenCalled();
      expect(result).toBe("mocked result");
    });

    it("should call cachePromise if the request is not from localhost", async () => {
      const req = { connection: { remoteAddress: "192.168.1.1" } };
      const options = { action: mockAction };
      jest.spyOn(cache, "cachePromise").mockResolvedValue("cached result");
      const result = await cache.cachePromiseIfNotLocal(options, req);
      expect(cache.cachePromise).toHaveBeenCalledWith(options);
      expect(result).toBe("cached result");
    });
  });

  describe("cachePromise", () => {
    it("should resolve with cached data if the cache is valid", async () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ mtime: new Date(Date.now() - 1000) });
      fs.readFile.mockImplementation((_, __, callback) =>
        callback(null, "cached data")
      );

      const options = {
        key: "testKey",
        action: mockAction,
        type: "string",
        time: 60000,
      };
      const result = await cache.cachePromise(options);

      expect(fs.readFile).toHaveBeenCalledWith(
        cacheFile,
        "utf8",
        expect.any(Function)
      );
      expect(result).toBe("cached data");
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should call action and cache the result if the cache is expired", async () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ mtime: new Date(Date.now() - 60001) });
      fs.writeFile.mockImplementation((_, __, callback) => callback(null));

      const options = {
        key: "testKey",
        action: mockAction,
        type: "string",
        time: 60000,
      };
      const result = await cache.cachePromise(options);

      expect(mockAction).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        cacheFile,
        "mocked result",
        expect.any(Function)
      );
      expect(result).toBe("mocked result");
    });

    it("should create the cache folder if it does not exist", async () => {
      fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFile.mockImplementation((_, __, callback) => callback(null));

      const options = {
        key: "testKey",
        action: mockAction,
        type: "string",
        time: 60000,
      };
      await cache.cachePromise(options);

      expect(fs.mkdirSync).toHaveBeenCalledWith(cacheFolder);
    });

    it("should resolve with the action result if no key or action is provided", async () => {
      const result = await cache.cachePromise({});
      expect(result).toBeUndefined();
      expect(mockAction).not.toHaveBeenCalled();
    });
  });
});
