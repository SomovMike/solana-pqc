var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// ../kit/node_modules/.pnpm/node-gyp-build@4.8.4/node_modules/node-gyp-build/node-gyp-build.js
var require_node_gyp_build = __commonJS({
  "../kit/node_modules/.pnpm/node-gyp-build@4.8.4/node_modules/node-gyp-build/node-gyp-build.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
    var vars = process.config && process.config.variables || {};
    var prebuildsOnly = !!process.env.PREBUILDS_ONLY;
    var abi = process.versions.modules;
    var runtime = isElectron() ? "electron" : isNwjs() ? "node-webkit" : "node";
    var arch = process.env.npm_config_arch || os.arch();
    var platform = process.env.npm_config_platform || os.platform();
    var libc = process.env.LIBC || (isAlpine(platform) ? "musl" : "glibc");
    var armv = process.env.ARM_VERSION || (arch === "arm64" ? "8" : vars.arm_version) || "";
    var uv = (process.versions.uv || "").split(".")[0];
    module2.exports = load;
    function load(dir) {
      return runtimeRequire(load.resolve(dir));
    }
    load.resolve = load.path = function(dir) {
      dir = path.resolve(dir || ".");
      try {
        var name = runtimeRequire(path.join(dir, "package.json")).name.toUpperCase().replace(/-/g, "_");
        if (process.env[name + "_PREBUILD"]) dir = process.env[name + "_PREBUILD"];
      } catch (err) {
      }
      if (!prebuildsOnly) {
        var release = getFirst(path.join(dir, "build/Release"), matchBuild);
        if (release) return release;
        var debug = getFirst(path.join(dir, "build/Debug"), matchBuild);
        if (debug) return debug;
      }
      var prebuild = resolve(dir);
      if (prebuild) return prebuild;
      var nearby = resolve(path.dirname(process.execPath));
      if (nearby) return nearby;
      var target = [
        "platform=" + platform,
        "arch=" + arch,
        "runtime=" + runtime,
        "abi=" + abi,
        "uv=" + uv,
        armv ? "armv=" + armv : "",
        "libc=" + libc,
        "node=" + process.versions.node,
        process.versions.electron ? "electron=" + process.versions.electron : "",
        typeof __webpack_require__ === "function" ? "webpack=true" : ""
        // eslint-disable-line
      ].filter(Boolean).join(" ");
      throw new Error("No native build was found for " + target + "\n    loaded from: " + dir + "\n");
      function resolve(dir2) {
        var tuples = readdirSync(path.join(dir2, "prebuilds")).map(parseTuple);
        var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0];
        if (!tuple) return;
        var prebuilds = path.join(dir2, "prebuilds", tuple.name);
        var parsed = readdirSync(prebuilds).map(parseTags);
        var candidates = parsed.filter(matchTags(runtime, abi));
        var winner = candidates.sort(compareTags(runtime))[0];
        if (winner) return path.join(prebuilds, winner.file);
      }
    };
    function readdirSync(dir) {
      try {
        return fs.readdirSync(dir);
      } catch (err) {
        return [];
      }
    }
    function getFirst(dir, filter) {
      var files = readdirSync(dir).filter(filter);
      return files[0] && path.join(dir, files[0]);
    }
    function matchBuild(name) {
      return /\.node$/.test(name);
    }
    function parseTuple(name) {
      var arr = name.split("-");
      if (arr.length !== 2) return;
      var platform2 = arr[0];
      var architectures = arr[1].split("+");
      if (!platform2) return;
      if (!architectures.length) return;
      if (!architectures.every(Boolean)) return;
      return { name, platform: platform2, architectures };
    }
    function matchTuple(platform2, arch2) {
      return function(tuple) {
        if (tuple == null) return false;
        if (tuple.platform !== platform2) return false;
        return tuple.architectures.includes(arch2);
      };
    }
    function compareTuples(a, b) {
      return a.architectures.length - b.architectures.length;
    }
    function parseTags(file) {
      var arr = file.split(".");
      var extension = arr.pop();
      var tags = { file, specificity: 0 };
      if (extension !== "node") return;
      for (var i = 0; i < arr.length; i++) {
        var tag = arr[i];
        if (tag === "node" || tag === "electron" || tag === "node-webkit") {
          tags.runtime = tag;
        } else if (tag === "napi") {
          tags.napi = true;
        } else if (tag.slice(0, 3) === "abi") {
          tags.abi = tag.slice(3);
        } else if (tag.slice(0, 2) === "uv") {
          tags.uv = tag.slice(2);
        } else if (tag.slice(0, 4) === "armv") {
          tags.armv = tag.slice(4);
        } else if (tag === "glibc" || tag === "musl") {
          tags.libc = tag;
        } else {
          continue;
        }
        tags.specificity++;
      }
      return tags;
    }
    function matchTags(runtime2, abi2) {
      return function(tags) {
        if (tags == null) return false;
        if (tags.runtime && tags.runtime !== runtime2 && !runtimeAgnostic(tags)) return false;
        if (tags.abi && tags.abi !== abi2 && !tags.napi) return false;
        if (tags.uv && tags.uv !== uv) return false;
        if (tags.armv && tags.armv !== armv) return false;
        if (tags.libc && tags.libc !== libc) return false;
        return true;
      };
    }
    function runtimeAgnostic(tags) {
      return tags.runtime === "node" && tags.napi;
    }
    function compareTags(runtime2) {
      return function(a, b) {
        if (a.runtime !== b.runtime) {
          return a.runtime === runtime2 ? -1 : 1;
        } else if (a.abi !== b.abi) {
          return a.abi ? -1 : 1;
        } else if (a.specificity !== b.specificity) {
          return a.specificity > b.specificity ? -1 : 1;
        } else {
          return 0;
        }
      };
    }
    function isNwjs() {
      return !!(process.versions && process.versions.nw);
    }
    function isElectron() {
      if (process.versions && process.versions.electron) return true;
      if (process.env.ELECTRON_RUN_AS_NODE) return true;
      return typeof window !== "undefined" && window.process && window.process.type === "renderer";
    }
    function isAlpine(platform2) {
      return platform2 === "linux" && fs.existsSync("/etc/alpine-release");
    }
    load.parseTags = parseTags;
    load.matchTags = matchTags;
    load.compareTags = compareTags;
    load.parseTuple = parseTuple;
    load.matchTuple = matchTuple;
    load.compareTuples = compareTuples;
  }
});

// ../kit/node_modules/.pnpm/node-gyp-build@4.8.4/node_modules/node-gyp-build/index.js
var require_node_gyp_build2 = __commonJS({
  "../kit/node_modules/.pnpm/node-gyp-build@4.8.4/node_modules/node-gyp-build/index.js"(exports2, module2) {
    var runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
    if (typeof runtimeRequire.addon === "function") {
      module2.exports = runtimeRequire.addon.bind(runtimeRequire);
    } else {
      module2.exports = require_node_gyp_build();
    }
  }
});

// ../kit/node_modules/.pnpm/bufferutil@4.0.9/node_modules/bufferutil/fallback.js
var require_fallback = __commonJS({
  "../kit/node_modules/.pnpm/bufferutil@4.0.9/node_modules/bufferutil/fallback.js"(exports2, module2) {
    "use strict";
    var mask = (source, mask2, output, offset, length) => {
      for (var i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask2[i & 3];
      }
    };
    var unmask = (buffer, mask2) => {
      const length = buffer.length;
      for (var i = 0; i < length; i++) {
        buffer[i] ^= mask2[i & 3];
      }
    };
    module2.exports = { mask, unmask };
  }
});

// ../kit/node_modules/.pnpm/bufferutil@4.0.9/node_modules/bufferutil/index.js
var require_bufferutil = __commonJS({
  "../kit/node_modules/.pnpm/bufferutil@4.0.9/node_modules/bufferutil/index.js"(exports2, module2) {
    "use strict";
    try {
      module2.exports = require_node_gyp_build2()(__dirname);
    } catch (e7) {
      module2.exports = require_fallback();
    }
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer3(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer: toArrayBuffer3,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require_bufferutil();
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e7) {
      }
    }
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// ../kit/node_modules/.pnpm/utf-8-validate@5.0.10/node_modules/utf-8-validate/fallback.js
var require_fallback2 = __commonJS({
  "../kit/node_modules/.pnpm/utf-8-validate@5.0.10/node_modules/utf-8-validate/fallback.js"(exports2, module2) {
    "use strict";
    function isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    module2.exports = isValidUTF8;
  }
});

// ../kit/node_modules/.pnpm/utf-8-validate@5.0.10/node_modules/utf-8-validate/index.js
var require_utf_8_validate = __commonJS({
  "../kit/node_modules/.pnpm/utf-8-validate@5.0.10/node_modules/utf-8-validate/index.js"(exports2, module2) {
    "use strict";
    try {
      module2.exports = require_node_gyp_build2()(__dirname);
    } catch (e7) {
      module2.exports = require_fallback2();
    }
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require_utf_8_validate();
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e7) {
      }
    }
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer: toArrayBuffer3, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer3(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address2, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address2 !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address2, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address2, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address2 instanceof URL) {
        parsedUrl = address2;
      } else {
        try {
          parsedUrl = new URL(address2);
        } catch (e7) {
          throw new SyntaxError(`Invalid URL: ${address2}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address2);
          } catch (e7) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// ../kit/packages/errors/dist/index.node.mjs
var SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED = 1;
var SOLANA_ERROR__INVALID_NONCE = 2;
var SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND = 3;
var SOLANA_ERROR__BLOCKHASH_STRING_LENGTH_OUT_OF_RANGE = 4;
var SOLANA_ERROR__INVALID_BLOCKHASH_BYTE_LENGTH = 5;
var SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE = 6;
var SOLANA_ERROR__MALFORMED_BIGINT_STRING = 7;
var SOLANA_ERROR__MALFORMED_NUMBER_STRING = 8;
var SOLANA_ERROR__TIMESTAMP_OUT_OF_RANGE = 9;
var SOLANA_ERROR__MALFORMED_JSON_RPC_ERROR = 10;
var SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION = 11;
var SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS = 12;
var SOLANA_ERROR__JSON_RPC__PARSE_ERROR = -32700;
var SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR = -32603;
var SOLANA_ERROR__JSON_RPC__INVALID_PARAMS = -32602;
var SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND = -32601;
var SOLANA_ERROR__JSON_RPC__INVALID_REQUEST = -32600;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_UNREACHABLE = -32019;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_NOT_EPOCH_BOUNDARY = -32018;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_EPOCH_REWARDS_PERIOD_ACTIVE = -32017;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED = -32016;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION = -32015;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET = -32014;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_LEN_MISMATCH = -32013;
var SOLANA_ERROR__JSON_RPC__SCAN_ERROR = -32012;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE = -32011;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX = -32010;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED = -32009;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT = -32008;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED = -32007;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_PRECOMPILE_VERIFICATION_FAILURE = -32006;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY = -32005;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE = -32004;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_VERIFICATION_FAILURE = -32003;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE = -32002;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP = -32001;
var SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH = 28e5;
var SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE = 2800001;
var SOLANA_ERROR__ADDRESSES__INVALID_BASE58_ENCODED_ADDRESS = 2800002;
var SOLANA_ERROR__ADDRESSES__INVALID_ED25519_PUBLIC_KEY = 2800003;
var SOLANA_ERROR__ADDRESSES__MALFORMED_PDA = 2800004;
var SOLANA_ERROR__ADDRESSES__PDA_BUMP_SEED_OUT_OF_RANGE = 2800005;
var SOLANA_ERROR__ADDRESSES__MAX_NUMBER_OF_PDA_SEEDS_EXCEEDED = 2800006;
var SOLANA_ERROR__ADDRESSES__MAX_PDA_SEED_LENGTH_EXCEEDED = 2800007;
var SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE = 2800008;
var SOLANA_ERROR__ADDRESSES__FAILED_TO_FIND_VIABLE_PDA_BUMP_SEED = 2800009;
var SOLANA_ERROR__ADDRESSES__PDA_ENDS_WITH_PDA_MARKER = 2800010;
var SOLANA_ERROR__ADDRESSES__INVALID_OFF_CURVE_ADDRESS = 2800011;
var SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND = 323e4;
var SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND = 32300001;
var SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT = 3230002;
var SOLANA_ERROR__ACCOUNTS__EXPECTED_DECODED_ACCOUNT = 3230003;
var SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED = 3230004;
var SOLANA_ERROR__SUBTLE_CRYPTO__DISALLOWED_IN_INSECURE_CONTEXT = 361e4;
var SOLANA_ERROR__SUBTLE_CRYPTO__DIGEST_UNIMPLEMENTED = 3610001;
var SOLANA_ERROR__SUBTLE_CRYPTO__ED25519_ALGORITHM_UNIMPLEMENTED = 3610002;
var SOLANA_ERROR__SUBTLE_CRYPTO__EXPORT_FUNCTION_UNIMPLEMENTED = 3610003;
var SOLANA_ERROR__SUBTLE_CRYPTO__GENERATE_FUNCTION_UNIMPLEMENTED = 3610004;
var SOLANA_ERROR__SUBTLE_CRYPTO__SIGN_FUNCTION_UNIMPLEMENTED = 3610005;
var SOLANA_ERROR__SUBTLE_CRYPTO__VERIFY_FUNCTION_UNIMPLEMENTED = 3610006;
var SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY = 3610007;
var SOLANA_ERROR__CRYPTO__RANDOM_VALUES_FUNCTION_UNIMPLEMENTED = 3611e3;
var SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH = 3704e3;
var SOLANA_ERROR__KEYS__INVALID_PRIVATE_KEY_BYTE_LENGTH = 3704001;
var SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH = 3704002;
var SOLANA_ERROR__KEYS__SIGNATURE_STRING_LENGTH_OUT_OF_RANGE = 3704003;
var SOLANA_ERROR__KEYS__PUBLIC_KEY_MUST_MATCH_PRIVATE_KEY = 3704004;
var SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX = 3704005;
var SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT = 3704006;
var SOLANA_ERROR__FS__UNSUPPORTED_ENVIRONMENT = 3712e3;
var SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_ACCOUNTS = 4128e3;
var SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_DATA = 4128001;
var SOLANA_ERROR__INSTRUCTION__PROGRAM_ID_MISMATCH = 4128002;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN = 4615e3;
var SOLANA_ERROR__INSTRUCTION_ERROR__GENERIC_ERROR = 4615001;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT = 4615002;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_INSTRUCTION_DATA = 4615003;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_DATA = 4615004;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_TOO_SMALL = 4615005;
var SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS = 4615006;
var SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_PROGRAM_ID = 4615007;
var SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_REQUIRED_SIGNATURE = 4615008;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_ALREADY_INITIALIZED = 4615009;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNINITIALIZED_ACCOUNT = 4615010;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNBALANCED_INSTRUCTION = 4615011;
var SOLANA_ERROR__INSTRUCTION_ERROR__MODIFIED_PROGRAM_ID = 4615012;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_LAMPORT_SPEND = 4615013;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_DATA_MODIFIED = 4615014;
var SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_LAMPORT_CHANGE = 4615015;
var SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_DATA_MODIFIED = 4615016;
var SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_INDEX = 4615017;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_MODIFIED = 4615018;
var SOLANA_ERROR__INSTRUCTION_ERROR__RENT_EPOCH_MODIFIED = 4615019;
var SOLANA_ERROR__INSTRUCTION_ERROR__NOT_ENOUGH_ACCOUNT_KEYS = 4615020;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_SIZE_CHANGED = 4615021;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_EXECUTABLE = 4615022;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_FAILED = 4615023;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_OUTSTANDING = 4615024;
var SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_OUT_OF_SYNC = 4615025;
var SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM = 4615026;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ERROR = 4615027;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_DATA_MODIFIED = 4615028;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_LAMPORT_CHANGE = 4615029;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_ACCOUNT_NOT_RENT_EXEMPT = 4615030;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_PROGRAM_ID = 4615031;
var SOLANA_ERROR__INSTRUCTION_ERROR__CALL_DEPTH = 4615032;
var SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_ACCOUNT = 4615033;
var SOLANA_ERROR__INSTRUCTION_ERROR__REENTRANCY_NOT_ALLOWED = 4615034;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_SEED_LENGTH_EXCEEDED = 4615035;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_SEEDS = 4615036;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_REALLOC = 4615037;
var SOLANA_ERROR__INSTRUCTION_ERROR__COMPUTATIONAL_BUDGET_EXCEEDED = 4615038;
var SOLANA_ERROR__INSTRUCTION_ERROR__PRIVILEGE_ESCALATION = 4615039;
var SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_ENVIRONMENT_SETUP_FAILURE = 4615040;
var SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPLETE = 4615041;
var SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPILE = 4615042;
var SOLANA_ERROR__INSTRUCTION_ERROR__IMMUTABLE = 4615043;
var SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_AUTHORITY = 4615044;
var SOLANA_ERROR__INSTRUCTION_ERROR__BORSH_IO_ERROR = 4615045;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_RENT_EXEMPT = 4615046;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_OWNER = 4615047;
var SOLANA_ERROR__INSTRUCTION_ERROR__ARITHMETIC_OVERFLOW = 4615048;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_SYSVAR = 4615049;
var SOLANA_ERROR__INSTRUCTION_ERROR__ILLEGAL_OWNER = 4615050;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_DATA_ALLOCATIONS_EXCEEDED = 4615051;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_EXCEEDED = 4615052;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_INSTRUCTION_TRACE_LENGTH_EXCEEDED = 4615053;
var SOLANA_ERROR__INSTRUCTION_ERROR__BUILTIN_PROGRAMS_MUST_CONSUME_COMPUTE_UNITS = 4615054;
var SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS = 5508e3;
var SOLANA_ERROR__SIGNER__EXPECTED_KEY_PAIR_SIGNER = 5508001;
var SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_SIGNER = 5508002;
var SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_MODIFYING_SIGNER = 5508003;
var SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_PARTIAL_SIGNER = 5508004;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SIGNER = 5508005;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_MODIFYING_SIGNER = 5508006;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_PARTIAL_SIGNER = 5508007;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SENDING_SIGNER = 5508008;
var SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS = 5508009;
var SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING = 5508010;
var SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED = 5508011;
var SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION = 5508012;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED = 5607e3;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE = 5607001;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__APPLICATION_DOMAIN_STRING_LENGTH_OUT_OF_RANGE = 5607002;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__INVALID_APPLICATION_DOMAIN_BYTE_LENGTH = 5607003;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH = 5607004;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO = 5607005;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED = 5607006;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH = 5607007;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH = 5607008;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY = 5607009;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO = 5607010;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING = 5607011;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH = 5607012;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE = 5607013;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION = 5607014;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_SORTED = 5607015;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE = 5607016;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE = 5607017;
var SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_CANNOT_PAY_FEES = 5663e3;
var SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE = 5663001;
var SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME = 5663002;
var SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME = 5663003;
var SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_OUT_OF_RANGE = 5663004;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING = 5663005;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE = 5663006;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND = 5663007;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING = 5663008;
var SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING = 5663009;
var SOLANA_ERROR__TRANSACTION__ADDRESS_MISSING = 5663010;
var SOLANA_ERROR__TRANSACTION__FEE_PAYER_MISSING = 5663011;
var SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING = 5663012;
var SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_INSTRUCTIONS_MISSING = 5663013;
var SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_FIRST_INSTRUCTION_MUST_BE_ADVANCE_NONCE = 5663014;
var SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION = 5663015;
var SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES = 5663016;
var SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH = 5663017;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT = 5663018;
var SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT = 5663019;
var SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT = 5663020;
var SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED = 5663021;
var SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE = 5663022;
var SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES = 5663023;
var SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_MESSAGE_BYTES = 5663024;
var SOLANA_ERROR__TRANSACTION__CANNOT_DECODE_EMPTY_TRANSACTION_BYTES = 5663025;
var SOLANA_ERROR__TRANSACTION__VERSION_ZERO_MUST_BE_ENCODED_WITH_SIGNATURES_FIRST = 5663026;
var SOLANA_ERROR__TRANSACTION__SIGNATURE_COUNT_TOO_HIGH_FOR_TRANSACTION_BYTES = 5663027;
var SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS = 5663028;
var SOLANA_ERROR__TRANSACTION__INVALID_NONCE_ACCOUNT_INDEX = 5663029;
var SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND = 5663030;
var SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH = 5663031;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES = 5663032;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES = 5663033;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS = 5663034;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION = 5663035;
var SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN = 705e4;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_IN_USE = 7050001;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_LOADED_TWICE = 7050002;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_NOT_FOUND = 7050003;
var SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_ACCOUNT_NOT_FOUND = 7050004;
var SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE = 7050005;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_FOR_FEE = 7050006;
var SOLANA_ERROR__TRANSACTION_ERROR__ALREADY_PROCESSED = 7050007;
var SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND = 7050008;
var SOLANA_ERROR__TRANSACTION_ERROR__CALL_CHAIN_TOO_DEEP = 7050009;
var SOLANA_ERROR__TRANSACTION_ERROR__MISSING_SIGNATURE_FOR_FEE = 7050010;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_INDEX = 7050011;
var SOLANA_ERROR__TRANSACTION_ERROR__SIGNATURE_FAILURE = 7050012;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_PROGRAM_FOR_EXECUTION = 7050013;
var SOLANA_ERROR__TRANSACTION_ERROR__SANITIZE_FAILURE = 7050014;
var SOLANA_ERROR__TRANSACTION_ERROR__CLUSTER_MAINTENANCE = 7050015;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_BORROW_OUTSTANDING = 7050016;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_BLOCK_COST_LIMIT = 7050017;
var SOLANA_ERROR__TRANSACTION_ERROR__UNSUPPORTED_VERSION = 7050018;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_WRITABLE_ACCOUNT = 7050019;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_ACCOUNT_COST_LIMIT = 7050020;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_BLOCK_LIMIT = 7050021;
var SOLANA_ERROR__TRANSACTION_ERROR__TOO_MANY_ACCOUNT_LOCKS = 7050022;
var SOLANA_ERROR__TRANSACTION_ERROR__ADDRESS_LOOKUP_TABLE_NOT_FOUND = 7050023;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_OWNER = 7050024;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_DATA = 7050025;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_INDEX = 7050026;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_RENT_PAYING_ACCOUNT = 7050027;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_VOTE_COST_LIMIT = 7050028;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_TOTAL_LIMIT = 7050029;
var SOLANA_ERROR__TRANSACTION_ERROR__DUPLICATE_INSTRUCTION = 7050030;
var SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_RENT = 7050031;
var SOLANA_ERROR__TRANSACTION_ERROR__MAX_LOADED_ACCOUNTS_DATA_SIZE_EXCEEDED = 7050032;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_LOADED_ACCOUNTS_DATA_SIZE_LIMIT = 7050033;
var SOLANA_ERROR__TRANSACTION_ERROR__RESANITIZATION_NEEDED = 7050034;
var SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_EXECUTION_TEMPORARILY_RESTRICTED = 7050035;
var SOLANA_ERROR__TRANSACTION_ERROR__UNBALANCED_TRANSACTION = 7050036;
var SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN = 7618e3;
var SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE = 7618001;
var SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN = 7618002;
var SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN = 7618003;
var SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED = 7618004;
var SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND = 7618005;
var SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_INSTRUCTION_PLAN = 7618006;
var SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN = 7618007;
var SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT = 7618008;
var SOLANA_ERROR__INSTRUCTION_PLANS__EXPECTED_SUCCESSFUL_TRANSACTION_PLAN_RESULT = 7618009;
var SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY = 8078e3;
var SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH = 8078001;
var SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH = 8078002;
var SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH = 8078003;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH = 8078004;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH = 8078005;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH = 8078006;
var SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS = 8078007;
var SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE = 8078008;
var SOLANA_ERROR__CODECS__INVALID_DISCRIMINATED_UNION_VARIANT = 8078009;
var SOLANA_ERROR__CODECS__INVALID_ENUM_VARIANT = 8078010;
var SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE = 8078011;
var SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE = 8078012;
var SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH = 8078013;
var SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE = 8078014;
var SOLANA_ERROR__CODECS__INVALID_LITERAL_UNION_VARIANT = 8078015;
var SOLANA_ERROR__CODECS__LITERAL_UNION_DISCRIMINATOR_OUT_OF_RANGE = 8078016;
var SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE = 8078017;
var SOLANA_ERROR__CODECS__INVALID_CONSTANT = 8078018;
var SOLANA_ERROR__CODECS__EXPECTED_ZERO_VALUE_TO_MATCH_ITEM_FIXED_SIZE = 8078019;
var SOLANA_ERROR__CODECS__ENCODED_BYTES_MUST_NOT_INCLUDE_SENTINEL = 8078020;
var SOLANA_ERROR__CODECS__SENTINEL_MISSING_IN_DECODED_BYTES = 8078021;
var SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS = 8078022;
var SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY = 8078023;
var SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE = 8078024;
var SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES = 8078025;
var SOLANA_ERROR__RPC__INTEGER_OVERFLOW = 81e5;
var SOLANA_ERROR__RPC__TRANSPORT_HTTP_HEADER_FORBIDDEN = 8100001;
var SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR = 8100002;
var SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD = 8100003;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN = 819e4;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__EXPECTED_SERVER_SUBSCRIPTION_ID = 8190001;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CLOSED_BEFORE_MESSAGE_BUFFERED = 8190002;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED = 8190003;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT = 8190004;
var SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS = 85e5;
var SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_INSTRUCTION_TYPE = 8500001;
var SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION = 8500002;
var SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE = 8500003;
var SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL = 8500004;
var SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_ACCOUNT_TYPE = 8500005;
var SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_ACCOUNT = 8500006;
var SOLANA_ERROR__WALLET__NOT_CONNECTED = 89e5;
var SOLANA_ERROR__WALLET__NO_SIGNER_CONNECTED = 8900001;
var SOLANA_ERROR__WALLET__SIGNER_NOT_AVAILABLE = 8900002;
var SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_STATE_MISSING = 99e5;
var SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_MUST_NOT_POLL_BEFORE_RESOLVING_EXISTING_MESSAGE_PROMISE = 9900001;
var SOLANA_ERROR__INVARIANT_VIOLATION__CACHED_ABORTABLE_ITERABLE_CACHE_ENTRY_MISSING = 9900002;
var SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE = 9900003;
var SOLANA_ERROR__INVARIANT_VIOLATION__DATA_PUBLISHER_CHANNEL_UNIMPLEMENTED = 9900004;
var SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND = 9900005;
var SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND = 9900006;
function encodeValue(value) {
  if (Array.isArray(value)) {
    const commaSeparatedValues = value.map(encodeValue).join(
      "%2C%20"
      /* ", " */
    );
    return "%5B" + commaSeparatedValues + /* "]" */
    "%5D";
  } else if (typeof value === "bigint") {
    return `${value}n`;
  } else {
    return encodeURIComponent(
      String(
        value != null && Object.getPrototypeOf(value) === null ? (
          // Plain objects with no prototype don't have a `toString` method.
          // Convert them before stringifying them.
          { ...value }
        ) : value
      )
    );
  }
}
function encodeObjectContextEntry([key, value]) {
  return `${key}=${encodeValue(value)}`;
}
function encodeContextObject(context) {
  const searchParamsString = Object.entries(context).map(encodeObjectContextEntry).join("&");
  return Buffer.from(searchParamsString, "utf8").toString("base64");
}
var SolanaErrorMessages = {
  [SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND]: "Account not found at address: $address",
  [SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED]: "Not all accounts were decoded. Encoded accounts found at addresses: $addresses.",
  [SOLANA_ERROR__ACCOUNTS__EXPECTED_DECODED_ACCOUNT]: "Expected decoded account at address: $address",
  [SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT]: "Failed to decode account data at address: $address",
  [SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND]: "Accounts not found at addresses: $addresses",
  [SOLANA_ERROR__ADDRESSES__FAILED_TO_FIND_VIABLE_PDA_BUMP_SEED]: "Unable to find a viable program address bump seed.",
  [SOLANA_ERROR__ADDRESSES__INVALID_BASE58_ENCODED_ADDRESS]: "$putativeAddress is not a base58-encoded address.",
  [SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH]: "Expected base58 encoded address to decode to a byte array of length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__ADDRESSES__INVALID_ED25519_PUBLIC_KEY]: "The `CryptoKey` must be an `Ed25519` public key.",
  [SOLANA_ERROR__ADDRESSES__INVALID_OFF_CURVE_ADDRESS]: "$putativeOffCurveAddress is not a base58-encoded off-curve address.",
  [SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE]: "Invalid seeds; point must fall off the Ed25519 curve.",
  [SOLANA_ERROR__ADDRESSES__MALFORMED_PDA]: "Expected given program derived address to have the following format: [Address, ProgramDerivedAddressBump].",
  [SOLANA_ERROR__ADDRESSES__MAX_NUMBER_OF_PDA_SEEDS_EXCEEDED]: "A maximum of $maxSeeds seeds, including the bump seed, may be supplied when creating an address. Received: $actual.",
  [SOLANA_ERROR__ADDRESSES__MAX_PDA_SEED_LENGTH_EXCEEDED]: "The seed at index $index with length $actual exceeds the maximum length of $maxSeedLength bytes.",
  [SOLANA_ERROR__ADDRESSES__PDA_BUMP_SEED_OUT_OF_RANGE]: "Expected program derived address bump to be in the range [0, 255], got: $bump.",
  [SOLANA_ERROR__ADDRESSES__PDA_ENDS_WITH_PDA_MARKER]: "Program address cannot end with PDA marker.",
  [SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE]: "Expected base58-encoded address string of length in the range [32, 44]. Actual length: $actualLength.",
  [SOLANA_ERROR__BLOCKHASH_STRING_LENGTH_OUT_OF_RANGE]: "Expected base58-encoded blockhash string of length in the range [32, 44]. Actual length: $actualLength.",
  [SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED]: "The network has progressed past the last block for which this transaction could have been committed.",
  [SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY]: "Codec [$codecDescription] cannot decode empty byte arrays.",
  [SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS]: "Enum codec cannot use lexical values [$stringValues] as discriminators. Either remove all lexical values or set `useValuesAsDiscriminators` to `false`.",
  [SOLANA_ERROR__CODECS__ENCODED_BYTES_MUST_NOT_INCLUDE_SENTINEL]: "Sentinel [$hexSentinel] must not be present in encoded bytes [$hexEncodedBytes].",
  [SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH]: "Encoder and decoder must have the same fixed size, got [$encoderFixedSize] and [$decoderFixedSize].",
  [SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH]: "Encoder and decoder must have the same max size, got [$encoderMaxSize] and [$decoderMaxSize].",
  [SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH]: "Encoder and decoder must either both be fixed-size or variable-size.",
  [SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE]: "Enum discriminator out of range. Expected a number in [$formattedValidDiscriminators], got $discriminator.",
  [SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH]: "Expected a fixed-size codec, got a variable-size one.",
  [SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH]: "Codec [$codecDescription] expected a positive byte length, got $bytesLength.",
  [SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH]: "Expected a variable-size codec, got a fixed-size one.",
  [SOLANA_ERROR__CODECS__EXPECTED_ZERO_VALUE_TO_MATCH_ITEM_FIXED_SIZE]: "Codec [$codecDescription] expected zero-value [$hexZeroValue] to have the same size as the provided fixed-size item [$expectedSize bytes].",
  [SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH]: "Codec [$codecDescription] expected $expected bytes, got $bytesLength.",
  [SOLANA_ERROR__CODECS__INVALID_CONSTANT]: "Expected byte array constant [$hexConstant] to be present in data [$hexData] at offset [$offset].",
  [SOLANA_ERROR__CODECS__INVALID_DISCRIMINATED_UNION_VARIANT]: "Invalid discriminated union variant. Expected one of [$variants], got $value.",
  [SOLANA_ERROR__CODECS__INVALID_ENUM_VARIANT]: "Invalid enum variant. Expected one of [$stringValues] or a number in [$formattedNumericalValues], got $variant.",
  [SOLANA_ERROR__CODECS__INVALID_LITERAL_UNION_VARIANT]: "Invalid literal union variant. Expected one of [$variants], got $value.",
  [SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS]: "Expected [$codecDescription] to have $expected items, got $actual.",
  [SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE]: "Invalid value $value for base $base with alphabet $alphabet.",
  [SOLANA_ERROR__CODECS__LITERAL_UNION_DISCRIMINATOR_OUT_OF_RANGE]: "Literal union discriminator out of range. Expected a number between $minRange and $maxRange, got $discriminator.",
  [SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE]: "Codec [$codecDescription] expected number to be in the range [$min, $max], got $value.",
  [SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE]: "Codec [$codecDescription] expected offset to be in the range [0, $bytesLength], got $offset.",
  [SOLANA_ERROR__CODECS__SENTINEL_MISSING_IN_DECODED_BYTES]: "Expected sentinel [$hexSentinel] to be present in decoded bytes [$hexDecodedBytes].",
  [SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE]: "Union variant out of range. Expected an index between $minRange and $maxRange, got $variant.",
  [SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY]: "This decoder expected a byte array of exactly $expectedLength bytes, but $numExcessBytes unexpected excess bytes remained after decoding. Are you sure that you have chosen the correct decoder for this data?",
  [SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE]: "Invalid pattern match value. The provided value does not match any of the specified patterns.",
  [SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES]: "Invalid pattern match bytes. The provided byte array does not match any of the specified patterns.",
  [SOLANA_ERROR__CRYPTO__RANDOM_VALUES_FUNCTION_UNIMPLEMENTED]: "No random values implementation could be found.",
  [SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION]: "Failed to send transaction$causeMessage",
  [SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS]: "Failed to send transactions$causeMessages",
  [SOLANA_ERROR__FS__UNSUPPORTED_ENVIRONMENT]: "Filesystem operation `$operation` is not supported in this environment.",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_ALREADY_INITIALIZED]: "Instruction requires an uninitialized account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_FAILED]: "Instruction tries to borrow reference for an account which is already borrowed",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_OUTSTANDING]: "Instruction left account with an outstanding borrowed reference",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_SIZE_CHANGED]: "Program other than the account's owner changed the size of the account data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_TOO_SMALL]: "Account data too small for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_EXECUTABLE]: "Instruction expected an executable account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_RENT_EXEMPT]: "An account does not have enough lamports to be rent-exempt",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ARITHMETIC_OVERFLOW]: "Program arithmetic overflowed",
  [SOLANA_ERROR__INSTRUCTION_ERROR__BORSH_IO_ERROR]: "Failed to serialize or deserialize account data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__BUILTIN_PROGRAMS_MUST_CONSUME_COMPUTE_UNITS]: "Builtin programs must consume compute units",
  [SOLANA_ERROR__INSTRUCTION_ERROR__CALL_DEPTH]: "Cross-program invocation call depth too deep",
  [SOLANA_ERROR__INSTRUCTION_ERROR__COMPUTATIONAL_BUDGET_EXCEEDED]: "Computational budget exceeded",
  [SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM]: "Custom program error: #$code",
  [SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_INDEX]: "Instruction contains duplicate accounts",
  [SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_OUT_OF_SYNC]: "Instruction modifications of multiply-passed account differ",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_ACCOUNT_NOT_RENT_EXEMPT]: "Executable accounts must be rent exempt",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_DATA_MODIFIED]: "Instruction changed executable accounts data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_LAMPORT_CHANGE]: "Instruction changed the balance of an executable account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_MODIFIED]: "Instruction changed executable bit of an account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_DATA_MODIFIED]: "Instruction modified data of an account it does not own",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_LAMPORT_SPEND]: "Instruction spent from the balance of an account it does not own",
  [SOLANA_ERROR__INSTRUCTION_ERROR__GENERIC_ERROR]: "Generic instruction error",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ILLEGAL_OWNER]: "Provided owner is not allowed",
  [SOLANA_ERROR__INSTRUCTION_ERROR__IMMUTABLE]: "Account is immutable",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_AUTHORITY]: "Incorrect authority provided",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_PROGRAM_ID]: "Incorrect program id for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS]: "Insufficient funds for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_DATA]: "Invalid account data for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_OWNER]: "Invalid account owner",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT]: "Invalid program argument",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ERROR]: "Program returned invalid error code",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_INSTRUCTION_DATA]: "Invalid instruction data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_REALLOC]: "Failed to reallocate account data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_SEEDS]: "Provided seeds do not result in a valid address",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_DATA_ALLOCATIONS_EXCEEDED]: "Accounts data allocations exceeded the maximum allowed per transaction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_EXCEEDED]: "Max accounts exceeded",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_INSTRUCTION_TRACE_LENGTH_EXCEEDED]: "Max instruction trace length exceeded",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_SEED_LENGTH_EXCEEDED]: "Length of the seed is too long for address generation",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_ACCOUNT]: "An account required by the instruction is missing",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_REQUIRED_SIGNATURE]: "Missing required signature for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MODIFIED_PROGRAM_ID]: "Instruction illegally modified the program id of an account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__NOT_ENOUGH_ACCOUNT_KEYS]: "Insufficient account keys for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PRIVILEGE_ESCALATION]: "Cross-program invocation with unauthorized signer or writable account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_ENVIRONMENT_SETUP_FAILURE]: "Failed to create program execution environment",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPILE]: "Program failed to compile",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPLETE]: "Program failed to complete",
  [SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_DATA_MODIFIED]: "Instruction modified data of a read-only account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_LAMPORT_CHANGE]: "Instruction changed the balance of a read-only account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__REENTRANCY_NOT_ALLOWED]: "Cross-program invocation reentrancy not allowed for this instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__RENT_EPOCH_MODIFIED]: "Instruction modified rent epoch of an account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNBALANCED_INSTRUCTION]: "Sum of account balances before and after instruction do not match",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNINITIALIZED_ACCOUNT]: "Instruction requires an initialized account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN]: "The instruction failed with the error: $errorName",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_PROGRAM_ID]: "Unsupported program id",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_SYSVAR]: "Unsupported sysvar",
  [SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND]: "Invalid instruction plan kind: $kind.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN]: "The provided instruction plan is empty.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND]: "No failed transaction plan result was found in the provided transaction plan result.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED]: "This transaction plan executor does not support non-divisible sequential plans. To support them, you may create your own executor such that multi-transaction atomicity is preserved \u2014 e.g. by targetting RPCs that support transaction bundles.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN]: "The provided transaction plan failed to execute. See the `transactionPlanResult` attribute for more details. Note that the `cause` property is deprecated, and a future version will not set it.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN]: "The provided message has insufficient capacity to accommodate the next instruction(s) in this plan. Expected at least $numBytesRequired free byte(s), got $numFreeBytes byte(s).",
  [SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND]: "Invalid transaction plan kind: $kind.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE]: "No more instructions to pack; the message packer has completed the instruction plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_INSTRUCTION_PLAN]: "Unexpected instruction plan. Expected $expectedKind plan, got $actualKind plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN]: "Unexpected transaction plan. Expected $expectedKind plan, got $actualKind plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT]: "Unexpected transaction plan result. Expected $expectedKind plan, got $actualKind plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__EXPECTED_SUCCESSFUL_TRANSACTION_PLAN_RESULT]: "Expected a successful transaction plan result. I.e. there is at least one failed or cancelled transaction in the plan.",
  [SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_ACCOUNTS]: "The instruction does not have any accounts.",
  [SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_DATA]: "The instruction does not have any data.",
  [SOLANA_ERROR__INSTRUCTION__PROGRAM_ID_MISMATCH]: "Expected instruction to have progress address $expectedProgramAddress, got $actualProgramAddress.",
  [SOLANA_ERROR__INVALID_BLOCKHASH_BYTE_LENGTH]: "Expected base58 encoded blockhash to decode to a byte array of length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__INVALID_NONCE]: "The nonce `$expectedNonceValue` is no longer valid. It has advanced to `$actualNonceValue`",
  [SOLANA_ERROR__INVARIANT_VIOLATION__CACHED_ABORTABLE_ITERABLE_CACHE_ENTRY_MISSING]: "Invariant violation: Found no abortable iterable cache entry for key `$cacheKey`. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__INVARIANT_VIOLATION__DATA_PUBLISHER_CHANNEL_UNIMPLEMENTED]: "Invariant violation: This data publisher does not publish to the channel named `$channelName`. Supported channels include $supportedChannelNames.",
  [SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_MUST_NOT_POLL_BEFORE_RESOLVING_EXISTING_MESSAGE_PROMISE]: "Invariant violation: WebSocket message iterator state is corrupt; iterated without first resolving existing message promise. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_STATE_MISSING]: "Invariant violation: WebSocket message iterator is missing state storage. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE]: "Invariant violation: Switch statement non-exhaustive. Received unexpected value `$unexpectedValue`. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR]: "JSON-RPC error: Internal JSON-RPC error ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__INVALID_PARAMS]: "JSON-RPC error: Invalid method parameter(s) ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__INVALID_REQUEST]: "JSON-RPC error: The JSON sent is not a valid `Request` object ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND]: "JSON-RPC error: The method does not exist / is not available ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__PARSE_ERROR]: "JSON-RPC error: An error occurred on the server while parsing the JSON text ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__SCAN_ERROR]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_EPOCH_REWARDS_PERIOD_ACTIVE]: "Epoch rewards period still active at slot $slot",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_UNREACHABLE]: "Failed to query long-term storage; please try again",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED]: "Minimum context slot has not been reached",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY]: "Node is unhealthy; behind by $numSlotsBehind slots",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT]: "No snapshot",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE]: "Transaction simulation failed",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_NOT_EPOCH_BOUNDARY]: "Rewards cannot be found because slot $slot is not the epoch boundary. This may be due to gap in the queried node's local ledger or long-term storage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE]: "Transaction history is not available from this node",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_PRECOMPILE_VERIFICATION_FAILURE]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_LEN_MISMATCH]: "Transaction signature length mismatch",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_VERIFICATION_FAILURE]: "Transaction signature verification failure",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION]: "$__serverMessage",
  [SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX]: "The grind regex `/$source/` contains the character `$character`, which is not in the base58 alphabet and can never match a Solana address.",
  [SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH]: "Key pair bytes must be of length 64, got $byteLength.",
  [SOLANA_ERROR__KEYS__INVALID_PRIVATE_KEY_BYTE_LENGTH]: "Expected private key bytes with length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH]: "Expected base58-encoded signature to decode to a byte array of length 64. Actual length: $actualLength.",
  [SOLANA_ERROR__KEYS__PUBLIC_KEY_MUST_MATCH_PRIVATE_KEY]: "The provided private key does not match the provided public key.",
  [SOLANA_ERROR__KEYS__SIGNATURE_STRING_LENGTH_OUT_OF_RANGE]: "Expected base58-encoded signature string of length in the range [64, 88]. Actual length: $actualLength.",
  [SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT]: "Writing a key pair to disk is not supported in this environment.",
  [SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE]: "Lamports value must be in the range [0, 2e64-1]",
  [SOLANA_ERROR__MALFORMED_BIGINT_STRING]: "`$value` cannot be parsed as a `BigInt`",
  [SOLANA_ERROR__MALFORMED_JSON_RPC_ERROR]: "$message",
  [SOLANA_ERROR__MALFORMED_NUMBER_STRING]: "`$value` cannot be parsed as a `Number`",
  [SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND]: "No nonce account could be found at address `$nonceAccountAddress`",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__INVALID_APPLICATION_DOMAIN_BYTE_LENGTH]: "Expected base58 encoded application domain to decode to a byte array of length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE]: "Attempted to sign an offchain message with an address that is not a signer for it",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__APPLICATION_DOMAIN_STRING_LENGTH_OUT_OF_RANGE]: "Expected base58-encoded application domain string of length in the range [32, 44]. Actual length: $actualLength.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH]: "The signer addresses in this offchain message envelope do not match the list of required signers in the message preamble. These unexpected signers were present in the envelope: `[$unexpectedSigners]`. These required signers were missing from the envelope `[$missingSigners]`.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED]: "The message body provided has a byte-length of $actualBytes. The maximum allowable byte-length is $maxBytes",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH]: "Expected message format $expectedMessageFormat, got $actualMessageFormat",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH]: "The message length specified in the message preamble is $specifiedLength bytes. The actual length of the message is $actualLength bytes.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY]: "Offchain message content must be non-empty",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO]: "Offchain message must specify the address of at least one required signer",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO]: "Offchain message envelope must reserve space for at least one signature",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH]: "The offchain message preamble specifies $numRequiredSignatures required signature(s), got $signaturesLength.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_SORTED]: "The signatories of this offchain message must be listed in lexicographical order",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE]: "An address must be listed no more than once among the signatories of an offchain message",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING]: "Offchain message is missing signatures for addresses: $addresses.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE]: "Offchain message signature verification failed. Signature mismatch for required signatories [$signatoriesWithInvalidSignatures]. Missing signatures for signatories [$signatoriesWithMissingSignatures]",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE]: "The message body provided contains characters whose codes fall outside the allowed range. In order to ensure clear-signing compatiblity with hardware wallets, the message may only contain line feeds and characters in the range [\\x20-\\x7e].",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION]: "Expected offchain message version $expectedVersion. Got $actualVersion.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED]: "This version of Kit does not support decoding offchain messages with version $unsupportedVersion. The current max supported version is 0.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_ACCOUNT]: "The provided account could not be identified as an account from the $programName program.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION]: "The provided instruction could not be identified as an instruction from the $programName program.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS]: "The provided instruction is missing some accounts. Expected at least $expectedAccountMetas account(s), got $actualAccountMetas.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL]: "Expected resolved instruction input '$inputName' to be non-null.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE]: "Expected resolved instruction input '$inputName' to be of type `$expectedType`.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_ACCOUNT_TYPE]: "Unrecognized account type '$accountType' for the $programName program.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_INSTRUCTION_TYPE]: "Unrecognized instruction type '$instructionType' for the $programName program.",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN]: "The notification name must end in 'Notifications' and the API must supply a subscription plan creator function for the notification '$notificationName'.",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CLOSED_BEFORE_MESSAGE_BUFFERED]: "WebSocket was closed before payload could be added to the send buffer",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED]: "WebSocket connection closed",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT]: "WebSocket failed to connect",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__EXPECTED_SERVER_SUBSCRIPTION_ID]: "Failed to obtain a subscription id from the server",
  [SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD]: "Could not find an API plan for RPC method: `$method`",
  [SOLANA_ERROR__RPC__INTEGER_OVERFLOW]: "The $argumentLabel argument to the `$methodName` RPC method$optionalPathLabel was `$value`. This number is unsafe for use with the Solana JSON-RPC because it exceeds `Number.MAX_SAFE_INTEGER`.",
  [SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR]: "HTTP error ($statusCode): $message",
  [SOLANA_ERROR__RPC__TRANSPORT_HTTP_HEADER_FORBIDDEN]: "HTTP header(s) forbidden: $headers. Learn more at https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name.",
  [SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS]: "Multiple distinct signers were identified for address `$address`. Please ensure that you are using the same signer instance for each address.",
  [SOLANA_ERROR__SIGNER__EXPECTED_KEY_PAIR_SIGNER]: "The provided value does not implement the `KeyPairSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_MODIFYING_SIGNER]: "The provided value does not implement the `MessageModifyingSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_PARTIAL_SIGNER]: "The provided value does not implement the `MessagePartialSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_SIGNER]: "The provided value does not implement any of the `MessageSigner` interfaces",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_MODIFYING_SIGNER]: "The provided value does not implement the `TransactionModifyingSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_PARTIAL_SIGNER]: "The provided value does not implement the `TransactionPartialSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SENDING_SIGNER]: "The provided value does not implement the `TransactionSendingSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SIGNER]: "The provided value does not implement any of the `TransactionSigner` interfaces",
  [SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS]: "More than one `TransactionSendingSigner` was identified.",
  [SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING]: "No `TransactionSendingSigner` was identified. Please provide a valid `TransactionWithSingleSendingSigner` transaction.",
  [SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION]: "The wallet account $address cannot be used to create a transaction signer because it does not implement either the `solana:signTransaction` or `solana:signAndSendTransaction` feature. At least one of these features is required. The account supports the following features: $supportedFeatures.",
  [SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED]: "Wallet account signers do not support signing multiple messages/transactions in a single operation",
  [SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY]: "Cannot export a non-extractable key.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__DIGEST_UNIMPLEMENTED]: "No digest implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__DISALLOWED_IN_INSECURE_CONTEXT]: "Cryptographic operations are only allowed in secure browser contexts. Read more here: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__ED25519_ALGORITHM_UNIMPLEMENTED]: "This runtime does not support the generation of Ed25519 key pairs.\n\nInstall @solana/webcrypto-ed25519-polyfill and call its `install` function before generating keys in environments that do not support Ed25519.\n\nFor a list of runtimes that currently support Ed25519 operations, visit https://github.com/WICG/webcrypto-secure-curves/issues/20.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__EXPORT_FUNCTION_UNIMPLEMENTED]: "No key export implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__GENERATE_FUNCTION_UNIMPLEMENTED]: "No key generation implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__SIGN_FUNCTION_UNIMPLEMENTED]: "No signing implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__VERIFY_FUNCTION_UNIMPLEMENTED]: "No signature verification implementation could be found.",
  [SOLANA_ERROR__TIMESTAMP_OUT_OF_RANGE]: "Timestamp value must be in the range [-(2n ** 63n), (2n ** 63n) - 1]. `$value` given",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_BORROW_OUTSTANDING]: "Transaction processing left an account with an outstanding borrowed reference",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_IN_USE]: "Account in use",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_LOADED_TWICE]: "Account loaded twice",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_NOT_FOUND]: "Attempt to debit an account but found no record of a prior credit.",
  [SOLANA_ERROR__TRANSACTION_ERROR__ADDRESS_LOOKUP_TABLE_NOT_FOUND]: "Transaction loads an address table account that doesn't exist",
  [SOLANA_ERROR__TRANSACTION_ERROR__ALREADY_PROCESSED]: "This transaction has already been processed",
  [SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND]: "Blockhash not found",
  [SOLANA_ERROR__TRANSACTION_ERROR__CALL_CHAIN_TOO_DEEP]: "Loader call chain is too deep",
  [SOLANA_ERROR__TRANSACTION_ERROR__CLUSTER_MAINTENANCE]: "Transactions are currently disabled due to cluster maintenance",
  [SOLANA_ERROR__TRANSACTION_ERROR__DUPLICATE_INSTRUCTION]: "Transaction contains a duplicate instruction ($index) that is not allowed",
  [SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE]: "Insufficient funds for fee",
  [SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_RENT]: "Transaction results in an account ($accountIndex) with insufficient funds for rent",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_FOR_FEE]: "This account may not be used to pay transaction fees",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_INDEX]: "Transaction contains an invalid account reference",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_DATA]: "Transaction loads an address table account with invalid data",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_INDEX]: "Transaction address table lookup uses an invalid index",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_OWNER]: "Transaction loads an address table account with an invalid owner",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_LOADED_ACCOUNTS_DATA_SIZE_LIMIT]: "LoadedAccountsDataSizeLimit set for transaction must be greater than 0.",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_PROGRAM_FOR_EXECUTION]: "This program may not be used for executing instructions",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_RENT_PAYING_ACCOUNT]: "Transaction leaves an account with a lower balance than rent-exempt minimum",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_WRITABLE_ACCOUNT]: "Transaction loads a writable account that cannot be written",
  [SOLANA_ERROR__TRANSACTION_ERROR__MAX_LOADED_ACCOUNTS_DATA_SIZE_EXCEEDED]: "Transaction exceeded max loaded accounts data size cap",
  [SOLANA_ERROR__TRANSACTION_ERROR__MISSING_SIGNATURE_FOR_FEE]: "Transaction requires a fee but has no signature present",
  [SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_ACCOUNT_NOT_FOUND]: "Attempt to load a program that does not exist",
  [SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_EXECUTION_TEMPORARILY_RESTRICTED]: "Execution of the program referenced by account at index $accountIndex is temporarily restricted.",
  [SOLANA_ERROR__TRANSACTION_ERROR__RESANITIZATION_NEEDED]: "ResanitizationNeeded",
  [SOLANA_ERROR__TRANSACTION_ERROR__SANITIZE_FAILURE]: "Transaction failed to sanitize accounts offsets correctly",
  [SOLANA_ERROR__TRANSACTION_ERROR__SIGNATURE_FAILURE]: "Transaction did not pass signature verification",
  [SOLANA_ERROR__TRANSACTION_ERROR__TOO_MANY_ACCOUNT_LOCKS]: "Transaction locked too many accounts",
  [SOLANA_ERROR__TRANSACTION_ERROR__UNBALANCED_TRANSACTION]: "Sum of account balances before and after transaction do not match",
  [SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN]: "The transaction failed with the error `$errorName`",
  [SOLANA_ERROR__TRANSACTION_ERROR__UNSUPPORTED_VERSION]: "Transaction version is unsupported",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_BLOCK_LIMIT]: "Transaction would exceed account data limit within the block",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_TOTAL_LIMIT]: "Transaction would exceed total account data limit",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_ACCOUNT_COST_LIMIT]: "Transaction would exceed max account limit within the block",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_BLOCK_COST_LIMIT]: "Transaction would exceed max Block Cost Limit",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_VOTE_COST_LIMIT]: "Transaction would exceed max Vote Cost Limit",
  [SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION]: "Attempted to sign a transaction with an address that is not a signer for it",
  [SOLANA_ERROR__TRANSACTION__ADDRESS_MISSING]: "Transaction is missing an address at index: $index.",
  [SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES]: "Transaction has no expected signers therefore it cannot be encoded",
  [SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT]: "Transaction size $transactionSize exceeds limit of $transactionSizeLimit bytes",
  [SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME]: "Transaction does not have a blockhash lifetime",
  [SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME]: "Transaction is not a durable nonce transaction",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING]: "Contents of these address lookup tables unknown: $lookupTableAddresses",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE]: "Lookup of address at index $highestRequestedIndex failed for lookup table `$lookupTableAddress`. Highest known index is $highestKnownIndex. The lookup table may have been extended since its contents were retrieved",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING]: "No fee payer set in CompiledTransaction",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND]: "Could not find program address at index $index",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT]: "Failed to estimate the compute unit consumption for this transaction message. This is likely because simulating the transaction failed. Inspect the `cause` property of this error to learn more",
  [SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT]: "Transaction failed when it was simulated in order to estimate the compute unit consumption. The compute unit estimate provided is for a transaction that failed when simulated and may not be representative of the compute units this transaction would consume if successful. Inspect the `cause` property of this error to learn more",
  [SOLANA_ERROR__TRANSACTION__FEE_PAYER_MISSING]: "Transaction is missing a fee payer.",
  [SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING]: "Could not determine this transaction's signature. Make sure that the transaction has been signed by its fee payer.",
  [SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_FIRST_INSTRUCTION_MUST_BE_ADVANCE_NONCE]: "Transaction first instruction is not advance nonce account instruction.",
  [SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_INSTRUCTIONS_MISSING]: "Transaction with no instructions cannot be durable nonce transaction.",
  [SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_CANNOT_PAY_FEES]: "This transaction includes an address (`$programAddress`) which is both invoked and set as the fee payer. Program addresses may not pay fees",
  [SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE]: "This transaction includes an address (`$programAddress`) which is both invoked and marked writable. Program addresses may not be writable",
  [SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH]: "The transaction message expected the transaction to have $numRequiredSignatures signatures, got $signaturesLength.",
  [SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING]: "Transaction is missing signatures for addresses: $addresses.",
  [SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_OUT_OF_RANGE]: "Transaction version must be in the range [0, 127]. `$actualVersion` given",
  [SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED]: "This version of Kit does not support decoding transactions with version $unsupportedVersion. The current max supported version is 1.",
  [SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE]: "The transaction has a durable nonce lifetime (with nonce `$nonce`), but the nonce account address is in a lookup table. The lifetime constraint cannot be constructed without fetching the lookup tables for the transaction.",
  [SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS]: "Invalid transaction config mask: $mask. Bits 0 and 1 must match (both set or both unset)",
  [SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES]: "Transaction message bytes are malformed: $messageBytes",
  [SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_MESSAGE_BYTES]: "Transaction message bytes are empty, so the transaction cannot be encoded",
  [SOLANA_ERROR__TRANSACTION__CANNOT_DECODE_EMPTY_TRANSACTION_BYTES]: "Transaction bytes are empty, so no transaction can be decoded",
  [SOLANA_ERROR__TRANSACTION__VERSION_ZERO_MUST_BE_ENCODED_WITH_SIGNATURES_FIRST]: "Transaction version 0 must be encoded with signatures first. This transaction was encoded with first byte $firstByte, which is expected to be a signature count for v0 transactions.",
  [SOLANA_ERROR__TRANSACTION__SIGNATURE_COUNT_TOO_HIGH_FOR_TRANSACTION_BYTES]: "The provided transaction bytes expect that there should be $numExpectedSignatures signatures, but the bytes are not long enough to contain a transaction message with this many signatures. The provided bytes are $transactionBytesLength bytes long.",
  [SOLANA_ERROR__TRANSACTION__INVALID_NONCE_ACCOUNT_INDEX]: "The transaction has a durable nonce lifetime, but the nonce account index is invalid. Expected a nonce account index less than $numberOfStaticAccounts, got $nonceAccountIndex.",
  [SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND]: "The transaction config value for $configName has the incorrect kind. Expected $expectedKind, got $actualKind.",
  [SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH]: "The transaction does not have the same number of instruction headers and instruction payloads. Got $numInstructionHeaders instruction headers, and $numInstructionPayloads instruction payloads.",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES]: "Transaction has $actualCount unique signer addresses but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES]: "Transaction has $actualCount unique account addresses but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS]: "Transaction has $actualCount instructions but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION]: "The instruction at index $instructionIndex has $actualCount account references but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__WALLET__NOT_CONNECTED]: "Cannot $operation: no wallet connected",
  [SOLANA_ERROR__WALLET__NO_SIGNER_CONNECTED]: "No signing wallet connected (status: $status)",
  [SOLANA_ERROR__WALLET__SIGNER_NOT_AVAILABLE]: "Connected wallet does not support signing"
};
var INSTRUCTION_ERROR_RANGE_SIZE = 1e3;
var START_INDEX = "i";
var TYPE = "t";
function getHumanReadableErrorMessage(code, context = {}) {
  const messageFormatString = SolanaErrorMessages[code];
  if (messageFormatString.length === 0) {
    return "";
  }
  let state;
  function commitStateUpTo(endIndex) {
    if (state[TYPE] === 2) {
      const variableName = messageFormatString.slice(state[START_INDEX] + 1, endIndex);
      fragments.push(
        variableName in context ? (
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `${context[variableName]}`
        ) : `$${variableName}`
      );
    } else if (state[TYPE] === 1) {
      fragments.push(messageFormatString.slice(state[START_INDEX], endIndex));
    }
  }
  const fragments = [];
  messageFormatString.split("").forEach((char, ii) => {
    if (ii === 0) {
      state = {
        [START_INDEX]: 0,
        [TYPE]: messageFormatString[0] === "\\" ? 0 : messageFormatString[0] === "$" ? 2 : 1
        /* Text */
      };
      return;
    }
    let nextState;
    switch (state[TYPE]) {
      case 0:
        nextState = {
          [START_INDEX]: ii,
          [TYPE]: 1
          /* Text */
        };
        break;
      case 1:
        if (char === "\\") {
          nextState = {
            [START_INDEX]: ii,
            [TYPE]: 0
            /* EscapeSequence */
          };
        } else if (char === "$") {
          nextState = {
            [START_INDEX]: ii,
            [TYPE]: 2
            /* Variable */
          };
        }
        break;
      case 2:
        if (char === "\\") {
          nextState = {
            [START_INDEX]: ii,
            [TYPE]: 0
            /* EscapeSequence */
          };
        } else if (char === "$") {
          nextState = {
            [START_INDEX]: ii,
            [TYPE]: 2
            /* Variable */
          };
        } else if (!char.match(/\w/)) {
          nextState = {
            [START_INDEX]: ii,
            [TYPE]: 1
            /* Text */
          };
        }
        break;
    }
    if (nextState) {
      if (state !== nextState) {
        commitStateUpTo(ii);
      }
      state = nextState;
    }
  });
  commitStateUpTo();
  let message = fragments.join("");
  if (code >= SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN && code < SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN + INSTRUCTION_ERROR_RANGE_SIZE && "index" in context) {
    message += ` (instruction #${context.index + 1})`;
  }
  return message;
}
function getErrorMessage(code, context = {}) {
  if (process.env.NODE_ENV !== "production") {
    return getHumanReadableErrorMessage(code, context);
  } else {
    let decodingAdviceMessage = `Solana error #${code}; Decode this error by running \`npx @solana/errors decode -- ${code}`;
    if (Object.keys(context).length) {
      decodingAdviceMessage += ` '${encodeContextObject(context)}'`;
    }
    return `${decodingAdviceMessage}\``;
  }
}
function isSolanaError(e7, code) {
  const isSolanaError2 = e7 instanceof Error && e7.name === "SolanaError";
  if (isSolanaError2) {
    if (code !== void 0) {
      return e7.context.__code === code;
    }
    return true;
  }
  return false;
}
var SolanaError = class extends Error {
  /**
   * Indicates the root cause of this {@link SolanaError}, if any.
   *
   * For example, a transaction error might have an instruction error as its root cause. In this
   * case, you will be able to access the instruction error on the transaction error as `cause`.
   */
  cause = this.cause;
  /**
   * Contains context that can assist in understanding or recovering from a {@link SolanaError}.
   */
  context;
  constructor(...[code, contextAndErrorOptions]) {
    let context;
    let errorOptions;
    if (contextAndErrorOptions) {
      Object.entries(Object.getOwnPropertyDescriptors(contextAndErrorOptions)).forEach(([name, descriptor]) => {
        if (name === "cause") {
          errorOptions = { cause: descriptor.value };
        } else {
          if (context === void 0) {
            context = {
              __code: code
            };
          }
          Object.defineProperty(context, name, descriptor);
        }
      });
    }
    const message = getErrorMessage(code, context);
    super(message, errorOptions);
    this.context = Object.freeze(
      context === void 0 ? {
        __code: code
      } : context
    );
    this.name = "SolanaError";
  }
};
function safeCaptureStackTrace(...args) {
  if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(...args);
  }
}
function getSolanaErrorFromRpcError({ errorCodeBaseOffset, getErrorContext, orderedErrorNames, rpcEnumError }, constructorOpt) {
  let rpcErrorName;
  let rpcErrorContext;
  if (typeof rpcEnumError === "string") {
    rpcErrorName = rpcEnumError;
  } else {
    rpcErrorName = Object.keys(rpcEnumError)[0];
    rpcErrorContext = rpcEnumError[rpcErrorName];
  }
  const codeOffset = orderedErrorNames.indexOf(rpcErrorName);
  const errorCode = errorCodeBaseOffset + codeOffset;
  const errorContext = getErrorContext(errorCode, rpcErrorName, rpcErrorContext);
  const err = new SolanaError(errorCode, errorContext);
  safeCaptureStackTrace(err, constructorOpt);
  return err;
}
var ORDERED_ERROR_NAMES = [
  // Keep synced with RPC source: https://github.com/anza-xyz/solana-sdk/blob/master/instruction-error/src/lib.rs
  // If this list ever gets too large, consider implementing a compression strategy like this:
  // https://gist.github.com/steveluscher/aaa7cbbb5433b1197983908a40860c47
  "GenericError",
  "InvalidArgument",
  "InvalidInstructionData",
  "InvalidAccountData",
  "AccountDataTooSmall",
  "InsufficientFunds",
  "IncorrectProgramId",
  "MissingRequiredSignature",
  "AccountAlreadyInitialized",
  "UninitializedAccount",
  "UnbalancedInstruction",
  "ModifiedProgramId",
  "ExternalAccountLamportSpend",
  "ExternalAccountDataModified",
  "ReadonlyLamportChange",
  "ReadonlyDataModified",
  "DuplicateAccountIndex",
  "ExecutableModified",
  "RentEpochModified",
  "NotEnoughAccountKeys",
  "AccountDataSizeChanged",
  "AccountNotExecutable",
  "AccountBorrowFailed",
  "AccountBorrowOutstanding",
  "DuplicateAccountOutOfSync",
  "Custom",
  "InvalidError",
  "ExecutableDataModified",
  "ExecutableLamportChange",
  "ExecutableAccountNotRentExempt",
  "UnsupportedProgramId",
  "CallDepth",
  "MissingAccount",
  "ReentrancyNotAllowed",
  "MaxSeedLengthExceeded",
  "InvalidSeeds",
  "InvalidRealloc",
  "ComputationalBudgetExceeded",
  "PrivilegeEscalation",
  "ProgramEnvironmentSetupFailure",
  "ProgramFailedToComplete",
  "ProgramFailedToCompile",
  "Immutable",
  "IncorrectAuthority",
  "BorshIoError",
  "AccountNotRentExempt",
  "InvalidAccountOwner",
  "ArithmeticOverflow",
  "UnsupportedSysvar",
  "IllegalOwner",
  "MaxAccountsDataAllocationsExceeded",
  "MaxAccountsExceeded",
  "MaxInstructionTraceLengthExceeded",
  "BuiltinProgramsMustConsumeComputeUnits"
];
function getSolanaErrorFromInstructionError(index, instructionError) {
  const numberIndex = Number(index);
  return getSolanaErrorFromRpcError(
    {
      errorCodeBaseOffset: 4615001,
      getErrorContext(errorCode, rpcErrorName, rpcErrorContext) {
        if (errorCode === SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN) {
          return {
            errorName: rpcErrorName,
            index: numberIndex,
            ...rpcErrorContext !== void 0 ? { instructionErrorContext: rpcErrorContext } : null
          };
        } else if (errorCode === SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM) {
          return {
            code: Number(rpcErrorContext),
            index: numberIndex
          };
        }
        return { index: numberIndex };
      },
      orderedErrorNames: ORDERED_ERROR_NAMES,
      rpcEnumError: instructionError
    },
    getSolanaErrorFromInstructionError
  );
}
var ORDERED_ERROR_NAMES2 = [
  // Keep synced with RPC source: https://github.com/anza-xyz/agave/blob/master/sdk/src/transaction/error.rs
  // If this list ever gets too large, consider implementing a compression strategy like this:
  // https://gist.github.com/steveluscher/aaa7cbbb5433b1197983908a40860c47
  "AccountInUse",
  "AccountLoadedTwice",
  "AccountNotFound",
  "ProgramAccountNotFound",
  "InsufficientFundsForFee",
  "InvalidAccountForFee",
  "AlreadyProcessed",
  "BlockhashNotFound",
  // `InstructionError` intentionally omitted; delegated to `getSolanaErrorFromInstructionError`
  "CallChainTooDeep",
  "MissingSignatureForFee",
  "InvalidAccountIndex",
  "SignatureFailure",
  "InvalidProgramForExecution",
  "SanitizeFailure",
  "ClusterMaintenance",
  "AccountBorrowOutstanding",
  "WouldExceedMaxBlockCostLimit",
  "UnsupportedVersion",
  "InvalidWritableAccount",
  "WouldExceedMaxAccountCostLimit",
  "WouldExceedAccountDataBlockLimit",
  "TooManyAccountLocks",
  "AddressLookupTableNotFound",
  "InvalidAddressLookupTableOwner",
  "InvalidAddressLookupTableData",
  "InvalidAddressLookupTableIndex",
  "InvalidRentPayingAccount",
  "WouldExceedMaxVoteCostLimit",
  "WouldExceedAccountDataTotalLimit",
  "DuplicateInstruction",
  "InsufficientFundsForRent",
  "MaxLoadedAccountsDataSizeExceeded",
  "InvalidLoadedAccountsDataSizeLimit",
  "ResanitizationNeeded",
  "ProgramExecutionTemporarilyRestricted",
  "UnbalancedTransaction"
];
function getSolanaErrorFromTransactionError(transactionError) {
  if (typeof transactionError === "object" && "InstructionError" in transactionError) {
    return getSolanaErrorFromInstructionError(
      ...transactionError.InstructionError
    );
  }
  return getSolanaErrorFromRpcError(
    {
      errorCodeBaseOffset: 7050001,
      getErrorContext(errorCode, rpcErrorName, rpcErrorContext) {
        if (errorCode === SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN) {
          return {
            errorName: rpcErrorName,
            ...rpcErrorContext !== void 0 ? { transactionErrorContext: rpcErrorContext } : null
          };
        } else if (errorCode === SOLANA_ERROR__TRANSACTION_ERROR__DUPLICATE_INSTRUCTION) {
          return {
            index: Number(rpcErrorContext)
          };
        } else if (errorCode === SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_RENT || errorCode === SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_EXECUTION_TEMPORARILY_RESTRICTED) {
          return {
            accountIndex: Number(rpcErrorContext.account_index)
          };
        }
      },
      orderedErrorNames: ORDERED_ERROR_NAMES2,
      rpcEnumError: transactionError
    },
    getSolanaErrorFromTransactionError
  );
}
function getSolanaErrorFromJsonRpcError(putativeErrorResponse) {
  let out;
  if (isRpcErrorResponse(putativeErrorResponse)) {
    const { code: rawCode, data, message } = putativeErrorResponse;
    const code = Number(rawCode);
    if (code === SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE) {
      const { err, ...preflightErrorContext } = data;
      const causeObject = err ? { cause: getSolanaErrorFromTransactionError(err) } : null;
      out = new SolanaError(SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE, {
        ...preflightErrorContext,
        ...causeObject
      });
    } else {
      let errorContext;
      switch (code) {
        case SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR:
        case SOLANA_ERROR__JSON_RPC__INVALID_PARAMS:
        case SOLANA_ERROR__JSON_RPC__INVALID_REQUEST:
        case SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND:
        case SOLANA_ERROR__JSON_RPC__PARSE_ERROR:
        case SOLANA_ERROR__JSON_RPC__SCAN_ERROR:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_PRECOMPILE_VERIFICATION_FAILURE:
        case SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION:
          errorContext = { __serverMessage: message };
          break;
        default:
          if (typeof data === "object" && !Array.isArray(data)) {
            errorContext = data;
          }
      }
      out = new SolanaError(code, errorContext);
    }
  } else {
    const message = typeof putativeErrorResponse === "object" && putativeErrorResponse !== null && "message" in putativeErrorResponse && typeof putativeErrorResponse.message === "string" ? putativeErrorResponse.message : "Malformed JSON-RPC error with no message attribute";
    out = new SolanaError(SOLANA_ERROR__MALFORMED_JSON_RPC_ERROR, { error: putativeErrorResponse, message });
  }
  safeCaptureStackTrace(out, getSolanaErrorFromJsonRpcError);
  return out;
}
function isRpcErrorResponse(value) {
  return typeof value === "object" && value !== null && "code" in value && "message" in value && (typeof value.code === "number" || typeof value.code === "bigint") && typeof value.message === "string";
}

// ../kit/packages/codecs-core/dist/index.node.mjs
function padBytes(bytes, length) {
  if (bytes.length >= length) return bytes;
  const paddedBytes = new Uint8Array(length).fill(0);
  paddedBytes.set(bytes);
  return paddedBytes;
}
var fixBytes = (bytes, length) => padBytes(bytes.length <= length ? bytes : bytes.slice(0, length), length);
function bytesEqual(bytes1, bytes2) {
  return bytes1.length === bytes2.length && bytes1.every((value, index) => value === bytes2[index]);
}
function getEncodedSize(value, encoder) {
  return "fixedSize" in encoder ? encoder.fixedSize : encoder.getSizeFromValue(value);
}
function createEncoder(encoder) {
  return Object.freeze({
    ...encoder,
    encode: (value) => {
      const bytes = new Uint8Array(getEncodedSize(value, encoder));
      encoder.write(value, bytes, 0);
      return bytes;
    }
  });
}
function createDecoder(decoder) {
  return Object.freeze({
    ...decoder,
    decode: (bytes, offset = 0) => decoder.read(bytes, offset)[0]
  });
}
function isFixedSize(codec) {
  return "fixedSize" in codec && typeof codec.fixedSize === "number";
}
function assertIsFixedSize(codec) {
  if (!isFixedSize(codec)) {
    throw new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH);
  }
}
function isVariableSize(codec) {
  return !isFixedSize(codec);
}
function assertByteArrayHasEnoughBytesForCodec(codecDescription, expected, bytes, offset = 0) {
  const bytesLength = bytes.length - offset;
  if (bytesLength < expected) {
    throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
      bytesLength,
      codecDescription,
      expected
    });
  }
}
function addEncoderSizePrefix(encoder, prefix) {
  const write = ((value, bytes, offset) => {
    const encoderBytes = encoder.encode(value);
    offset = prefix.write(encoderBytes.length, bytes, offset);
    bytes.set(encoderBytes, offset);
    return offset + encoderBytes.length;
  });
  if (isFixedSize(prefix) && isFixedSize(encoder)) {
    return createEncoder({ ...encoder, fixedSize: prefix.fixedSize + encoder.fixedSize, write });
  }
  const prefixMaxSize = isFixedSize(prefix) ? prefix.fixedSize : prefix.maxSize ?? null;
  const encoderMaxSize = isFixedSize(encoder) ? encoder.fixedSize : encoder.maxSize ?? null;
  const maxSize = prefixMaxSize !== null && encoderMaxSize !== null ? prefixMaxSize + encoderMaxSize : null;
  return createEncoder({
    ...encoder,
    ...maxSize !== null ? { maxSize } : {},
    getSizeFromValue: (value) => {
      const encoderSize = getEncodedSize(value, encoder);
      return getEncodedSize(encoderSize, prefix) + encoderSize;
    },
    write
  });
}
function toArrayBuffer(bytes, offset, length) {
  const bytesOffset = bytes.byteOffset + (offset ?? 0);
  const bytesLength = length ?? bytes.byteLength;
  let buffer;
  if (typeof SharedArrayBuffer === "undefined") {
    buffer = bytes.buffer;
  } else if (bytes.buffer instanceof SharedArrayBuffer) {
    buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(new Uint8Array(bytes));
  } else {
    buffer = bytes.buffer;
  }
  return (bytesOffset === 0 || bytesOffset === -bytes.byteLength) && bytesLength === bytes.byteLength ? buffer : buffer.slice(bytesOffset, bytesOffset + bytesLength);
}
function fixEncoderSize(encoder, fixedBytes) {
  return createEncoder({
    fixedSize: fixedBytes,
    write: (value, bytes, offset) => {
      const variableByteArray = encoder.encode(value);
      const fixedByteArray = variableByteArray.length > fixedBytes ? variableByteArray.slice(0, fixedBytes) : variableByteArray;
      bytes.set(fixedByteArray, offset);
      return offset + fixedBytes;
    }
  });
}
function fixDecoderSize(decoder, fixedBytes) {
  return createDecoder({
    fixedSize: fixedBytes,
    read: (bytes, offset) => {
      assertByteArrayHasEnoughBytesForCodec("fixCodecSize", fixedBytes, bytes, offset);
      if (offset > 0 || bytes.length > fixedBytes) {
        bytes = bytes.slice(offset, offset + fixedBytes);
      }
      if (isFixedSize(decoder)) {
        bytes = fixBytes(bytes, decoder.fixedSize);
      }
      const [value] = decoder.read(bytes, 0);
      return [value, offset + fixedBytes];
    }
  });
}
function transformEncoder(encoder, unmap) {
  return createEncoder({
    ...isVariableSize(encoder) ? { ...encoder, getSizeFromValue: (value) => encoder.getSizeFromValue(unmap(value)) } : encoder,
    write: (value, bytes, offset) => encoder.write(unmap(value), bytes, offset)
  });
}

// ../kit/packages/codecs-strings/dist/index.node.mjs
function assertValidBaseString(alphabet4, testValue, givenValue = testValue) {
  if (!testValue.match(new RegExp(`^[${alphabet4}]*$`))) {
    throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
      alphabet: alphabet4,
      base: alphabet4.length,
      value: givenValue
    });
  }
}
var getBaseXEncoder = (alphabet4) => {
  return createEncoder({
    getSizeFromValue: (value) => {
      const [leadingZeroes, tailChars] = partitionLeadingZeroes(value, alphabet4[0]);
      if (!tailChars) return value.length;
      const base10Number = getBigIntFromBaseX(tailChars, alphabet4);
      return leadingZeroes.length + Math.ceil(base10Number.toString(16).length / 2);
    },
    write(value, bytes, offset) {
      assertValidBaseString(alphabet4, value);
      if (value === "") return offset;
      const [leadingZeroes, tailChars] = partitionLeadingZeroes(value, alphabet4[0]);
      if (!tailChars) {
        bytes.set(new Uint8Array(leadingZeroes.length).fill(0), offset);
        return offset + leadingZeroes.length;
      }
      let base10Number = getBigIntFromBaseX(tailChars, alphabet4);
      const tailBytes = [];
      while (base10Number > 0n) {
        tailBytes.unshift(Number(base10Number % 256n));
        base10Number /= 256n;
      }
      const bytesToAdd = [...Array(leadingZeroes.length).fill(0), ...tailBytes];
      bytes.set(bytesToAdd, offset);
      return offset + bytesToAdd.length;
    }
  });
};
var getBaseXDecoder = (alphabet4) => {
  return createDecoder({
    read(rawBytes, offset) {
      const bytes = offset === 0 || offset <= -rawBytes.byteLength ? rawBytes : rawBytes.slice(offset);
      if (bytes.length === 0) return ["", 0];
      let trailIndex = bytes.findIndex((n) => n !== 0);
      trailIndex = trailIndex === -1 ? bytes.length : trailIndex;
      const leadingZeroes = alphabet4[0].repeat(trailIndex);
      if (trailIndex === bytes.length) return [leadingZeroes, rawBytes.length];
      const base10Number = bytes.slice(trailIndex).reduce((sum, byte) => sum * 256n + BigInt(byte), 0n);
      const tailChars = getBaseXFromBigInt(base10Number, alphabet4);
      return [leadingZeroes + tailChars, rawBytes.length];
    }
  });
};
function partitionLeadingZeroes(value, zeroCharacter) {
  const [leadingZeros, tailChars] = value.split(new RegExp(`((?!${zeroCharacter}).*)`));
  return [leadingZeros, tailChars];
}
function getBigIntFromBaseX(value, alphabet4) {
  const base = BigInt(alphabet4.length);
  let sum = 0n;
  for (const char of value) {
    sum *= base;
    sum += BigInt(alphabet4.indexOf(char));
  }
  return sum;
}
function getBaseXFromBigInt(value, alphabet4) {
  const base = BigInt(alphabet4.length);
  const tailChars = [];
  while (value > 0n) {
    tailChars.unshift(alphabet4[Number(value % base)]);
    value /= base;
  }
  return tailChars.join("");
}
var alphabet2 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var getBase58Encoder = () => getBaseXEncoder(alphabet2);
var getBase58Decoder = () => getBaseXDecoder(alphabet2);
var getBase64Decoder = () => {
  {
    return createDecoder({
      read: (bytes, offset = 0) => [Buffer.from(toArrayBuffer(bytes), offset).toString("base64"), bytes.length]
    });
  }
};
var e = globalThis.TextDecoder;
var o = globalThis.TextEncoder;

// ../kit/packages/assertions/dist/index.node.mjs
var cachedEd25519Decision;
async function isEd25519CurveSupported(subtle) {
  if (cachedEd25519Decision === void 0) {
    cachedEd25519Decision = new Promise((resolve) => {
      subtle.generateKey(
        "Ed25519",
        /* extractable */
        false,
        ["sign", "verify"]
      ).then(() => {
        resolve(cachedEd25519Decision = true);
      }).catch(() => {
        resolve(cachedEd25519Decision = false);
      });
    });
  }
  if (typeof cachedEd25519Decision === "boolean") {
    return cachedEd25519Decision;
  } else {
    return await cachedEd25519Decision;
  }
}
async function assertKeyGenerationIsAvailable() {
  if (typeof globalThis.crypto === "undefined" || typeof globalThis.crypto.subtle?.generateKey !== "function") {
    throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__GENERATE_FUNCTION_UNIMPLEMENTED);
  }
  if (!await isEd25519CurveSupported(globalThis.crypto.subtle)) {
    throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__ED25519_ALGORITHM_UNIMPLEMENTED);
  }
}
function assertKeyExporterIsAvailable() {
  if (typeof globalThis.crypto === "undefined" || typeof globalThis.crypto.subtle?.exportKey !== "function") {
    throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__EXPORT_FUNCTION_UNIMPLEMENTED);
  }
}
function assertSigningCapabilityIsAvailable() {
  if (typeof globalThis.crypto === "undefined" || typeof globalThis.crypto.subtle?.sign !== "function") {
    throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO__SIGN_FUNCTION_UNIMPLEMENTED);
  }
}

// ../kit/packages/addresses/dist/index.node.mjs
var memoizedBase58Encoder;
var memoizedBase58Decoder;
function getMemoizedBase58Encoder() {
  if (!memoizedBase58Encoder) memoizedBase58Encoder = getBase58Encoder();
  return memoizedBase58Encoder;
}
function getMemoizedBase58Decoder() {
  if (!memoizedBase58Decoder) memoizedBase58Decoder = getBase58Decoder();
  return memoizedBase58Decoder;
}
function isAddress(putativeAddress) {
  if (
    // Lowest address (32 bytes of zeroes)
    putativeAddress.length < 32 || // Highest address (32 bytes of 255)
    putativeAddress.length > 44
  ) {
    return false;
  }
  const base58Encoder = getMemoizedBase58Encoder();
  try {
    return base58Encoder.encode(putativeAddress).byteLength === 32;
  } catch {
    return false;
  }
}
function assertIsAddress(putativeAddress) {
  if (
    // Lowest address (32 bytes of zeroes)
    putativeAddress.length < 32 || // Highest address (32 bytes of 255)
    putativeAddress.length > 44
  ) {
    throw new SolanaError(SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE, {
      actualLength: putativeAddress.length
    });
  }
  const base58Encoder = getMemoizedBase58Encoder();
  const bytes = base58Encoder.encode(putativeAddress);
  const numBytes = bytes.byteLength;
  if (numBytes !== 32) {
    throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH, {
      actualLength: numBytes
    });
  }
}
function address(putativeAddress) {
  assertIsAddress(putativeAddress);
  return putativeAddress;
}
function getAddressEncoder() {
  return transformEncoder(
    fixEncoderSize(getMemoizedBase58Encoder(), 32),
    (putativeAddress) => address(putativeAddress)
  );
}
function getAddressDecoder() {
  return fixDecoderSize(getMemoizedBase58Decoder(), 32);
}
function getAddressComparator() {
  return new Intl.Collator("en", {
    caseFirst: "lower",
    ignorePunctuation: false,
    localeMatcher: "best fit",
    numeric: false,
    sensitivity: "variant",
    usage: "sort"
  }).compare;
}
async function getAddressFromPublicKey(publicKey) {
  assertKeyExporterIsAvailable();
  if (publicKey.type !== "public" || publicKey.algorithm.name !== "Ed25519") {
    throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_ED25519_PUBLIC_KEY);
  }
  const publicKeyBytes = await crypto.subtle.exportKey("raw", publicKey);
  return getAddressDecoder().decode(new Uint8Array(publicKeyBytes));
}

// ../kit/packages/codecs-numbers/dist/index.node.mjs
function assertNumberIsBetweenForCodec(codecDescription, min, max, value) {
  if (value < min || value > max) {
    throw new SolanaError(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, {
      codecDescription,
      max,
      min,
      value
    });
  }
}
function isLittleEndian(config) {
  return config?.endian === 1 ? false : true;
}
function numberEncoderFactory(input) {
  return createEncoder({
    fixedSize: input.size,
    write(value, bytes, offset) {
      if (input.range) {
        assertNumberIsBetweenForCodec(input.name, input.range[0], input.range[1], value);
      }
      const arrayBuffer = new ArrayBuffer(input.size);
      input.set(new DataView(arrayBuffer), value, isLittleEndian(input.config));
      bytes.set(new Uint8Array(arrayBuffer), offset);
      return offset + input.size;
    }
  });
}
var getShortU16Encoder = () => createEncoder({
  getSizeFromValue: (value) => {
    if (value <= 127) return 1;
    if (value <= 16383) return 2;
    return 3;
  },
  maxSize: 3,
  write: (value, bytes, offset) => {
    assertNumberIsBetweenForCodec("shortU16", 0, 65535, value);
    const shortU16Bytes = [0];
    for (let ii = 0; ; ii += 1) {
      const alignedValue = Number(value) >> ii * 7;
      if (alignedValue === 0) {
        break;
      }
      const nextSevenBits = 127 & alignedValue;
      shortU16Bytes[ii] = nextSevenBits;
      if (ii > 0) {
        shortU16Bytes[ii - 1] |= 128;
      }
    }
    bytes.set(shortU16Bytes, offset);
    return offset + shortU16Bytes.length;
  }
});
var getU16Encoder = (config = {}) => numberEncoderFactory({
  config,
  name: "u16",
  range: [0, Number("0xffff")],
  set: (view, value, le) => view.setUint16(0, Number(value), le),
  size: 2
});
var getU32Encoder = (config = {}) => numberEncoderFactory({
  config,
  name: "u32",
  range: [0, Number("0xffffffff")],
  set: (view, value, le) => view.setUint32(0, Number(value), le),
  size: 4
});
var getU64Encoder = (config = {}) => numberEncoderFactory({
  config,
  name: "u64",
  range: [0n, BigInt("0xffffffffffffffff")],
  set: (view, value, le) => view.setBigUint64(0, BigInt(value), le),
  size: 8
});
var getU8Encoder = () => numberEncoderFactory({
  name: "u8",
  range: [0, Number("0xff")],
  set: (view, value) => view.setUint8(0, Number(value)),
  size: 1
});

// ../kit/packages/codecs-data-structures/dist/index.node.mjs
function assertValidNumberOfItemsForCodec(codecDescription, expected, actual) {
  if (expected !== actual) {
    throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS, {
      actual,
      codecDescription,
      expected
    });
  }
}
function maxCodecSizes(sizes) {
  return sizes.reduce(
    (all, size) => all === null || size === null ? null : Math.max(all, size),
    0
  );
}
function sumCodecSizes(sizes) {
  return sizes.reduce((all, size) => all === null || size === null ? null : all + size, 0);
}
function getFixedSize(codec) {
  return isFixedSize(codec) ? codec.fixedSize : null;
}
function getMaxSize(codec) {
  return isFixedSize(codec) ? codec.fixedSize : codec.maxSize ?? null;
}
function getArrayEncoder(item, config = {}) {
  const size = config.size ?? getU32Encoder();
  const fixedSize = computeArrayLikeCodecSize(size, getFixedSize(item));
  const maxSize = computeArrayLikeCodecSize(size, getMaxSize(item)) ?? void 0;
  return createEncoder({
    ...fixedSize !== null ? { fixedSize } : {
      getSizeFromValue: (array) => {
        const prefixSize = typeof size === "object" ? getEncodedSize(array.length, size) : 0;
        return prefixSize + [...array].reduce((all, value) => all + getEncodedSize(value, item), 0);
      },
      maxSize
    },
    write: (array, bytes, offset) => {
      if (typeof size === "number") {
        assertValidNumberOfItemsForCodec(config.description ?? "array", size, array.length);
      }
      if (typeof size === "object") {
        offset = size.write(array.length, bytes, offset);
      }
      array.forEach((value) => {
        offset = item.write(value, bytes, offset);
      });
      return offset;
    }
  });
}
function computeArrayLikeCodecSize(size, itemSize) {
  if (typeof size !== "number") return null;
  if (size === 0) return 0;
  return itemSize === null ? null : itemSize * size;
}
function getBooleanEncoder(config = {}) {
  return transformEncoder(config.size ?? getU8Encoder(), (value) => value ? 1 : 0);
}
function getBytesEncoder() {
  return createEncoder({
    getSizeFromValue: (value) => value.length,
    write: (value, bytes, offset) => {
      bytes.set(value, offset);
      return offset + value.length;
    }
  });
}
function getConstantEncoder(constant) {
  return createEncoder({
    fixedSize: constant.length,
    write: (_, bytes, offset) => {
      bytes.set(constant, offset);
      return offset + constant.length;
    }
  });
}
function getTupleEncoder(items, config) {
  const fixedSize = sumCodecSizes(items.map(getFixedSize));
  const maxSize = sumCodecSizes(items.map(getMaxSize)) ?? void 0;
  return createEncoder({
    ...fixedSize === null ? {
      getSizeFromValue: (value) => items.map((item, index) => getEncodedSize(value[index], item)).reduce((all, one) => all + one, 0),
      maxSize
    } : { fixedSize },
    write: (value, bytes, offset) => {
      assertValidNumberOfItemsForCodec(config?.description ?? "tuple", items.length, value.length);
      items.forEach((item, index) => {
        offset = item.write(value[index], bytes, offset);
      });
      return offset;
    }
  });
}
function getUnionEncoder(variants, getIndexFromValue) {
  const fixedSize = getUnionFixedSize(variants);
  const write = (variant, bytes, offset) => {
    const index = getIndexFromValue(variant);
    assertValidVariantIndex(variants, index);
    return variants[index].write(variant, bytes, offset);
  };
  if (fixedSize !== null) {
    return createEncoder({ fixedSize, write });
  }
  const maxSize = getUnionMaxSize(variants);
  return createEncoder({
    ...maxSize !== null ? { maxSize } : {},
    getSizeFromValue: (variant) => {
      const index = getIndexFromValue(variant);
      assertValidVariantIndex(variants, index);
      return getEncodedSize(variant, variants[index]);
    },
    write
  });
}
function assertValidVariantIndex(variants, index) {
  if (typeof variants[index] === "undefined") {
    throw new SolanaError(SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE, {
      maxRange: variants.length - 1,
      minRange: 0,
      variant: index
    });
  }
}
function getUnionFixedSize(variants) {
  if (variants.length === 0) return 0;
  if (!isFixedSize(variants[0])) return null;
  const variantSize = variants[0].fixedSize;
  const sameSizedVariants = variants.every((variant) => isFixedSize(variant) && variant.fixedSize === variantSize);
  return sameSizedVariants ? variantSize : null;
}
function getUnionMaxSize(variants) {
  return maxCodecSizes(variants.map((variant) => getMaxSize(variant)));
}
function getUnitEncoder() {
  return createEncoder({
    fixedSize: 0,
    write: (_value, _bytes, offset) => offset
  });
}
function getNullableEncoder(item, config = {}) {
  const prefix = (() => {
    if (config.prefix === null) {
      return transformEncoder(getUnitEncoder(), (_boolean) => void 0);
    }
    return getBooleanEncoder({ size: config.prefix ?? getU8Encoder() });
  })();
  const noneValue = (() => {
    if (config.noneValue === "zeroes") {
      assertIsFixedSize(item);
      return fixEncoderSize(getUnitEncoder(), item.fixedSize);
    }
    if (!config.noneValue) {
      return getUnitEncoder();
    }
    return getConstantEncoder(config.noneValue);
  })();
  return getUnionEncoder(
    [
      transformEncoder(getTupleEncoder([prefix, noneValue]), (_value) => [
        false,
        void 0
      ]),
      transformEncoder(getTupleEncoder([prefix, item]), (value) => [true, value])
    ],
    (variant) => Number(variant !== null)
  );
}
function getPatternMatchEncoder(patterns) {
  return getUnionEncoder(
    patterns.map(([, encoder]) => encoder),
    (value) => {
      const index = patterns.findIndex(([predicate]) => predicate(value));
      if (index === -1) {
        throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE);
      }
      return index;
    }
  );
}
function getPredicateEncoder(predicate, ifTrue, ifFalse) {
  return getUnionEncoder([ifTrue, ifFalse], (value) => predicate(value) ? 0 : 1);
}
function getStructEncoder(fields) {
  const fieldCodecs = fields.map(([, codec]) => codec);
  const fixedSize = sumCodecSizes(fieldCodecs.map(getFixedSize));
  const maxSize = sumCodecSizes(fieldCodecs.map(getMaxSize)) ?? void 0;
  return createEncoder({
    ...fixedSize === null ? {
      getSizeFromValue: (value) => fields.map(([key, codec]) => getEncodedSize(value[key], codec)).reduce((all, one) => all + one, 0),
      maxSize
    } : { fixedSize },
    write: (struct, bytes, offset) => {
      fields.forEach(([key, codec]) => {
        offset = codec.write(struct[key], bytes, offset);
      });
      return offset;
    }
  });
}

// ../kit/packages/functional/dist/index.node.mjs
function pipe(init, ...fns) {
  return fns.reduce((acc, fn) => fn(acc), init);
}

// ../kit/packages/instructions/dist/index.node.mjs
var AccountRole = /* @__PURE__ */ ((AccountRole22) => {
  AccountRole22[AccountRole22["WRITABLE_SIGNER"] = /* 3 */
  3] = "WRITABLE_SIGNER";
  AccountRole22[AccountRole22["READONLY_SIGNER"] = /* 2 */
  2] = "READONLY_SIGNER";
  AccountRole22[AccountRole22["WRITABLE"] = /* 1 */
  1] = "WRITABLE";
  AccountRole22[AccountRole22["READONLY"] = /* 0 */
  0] = "READONLY";
  return AccountRole22;
})(AccountRole || {});
var IS_WRITABLE_BITMASK = 1;
function isSignerRole(role) {
  return role >= 2;
}
function isWritableRole(role) {
  return (role & IS_WRITABLE_BITMASK) !== 0;
}
function mergeRoles(roleA, roleB) {
  return roleA | roleB;
}

// ../kit/packages/rpc-types/dist/index.node.mjs
function isBlockhash(putativeBlockhash) {
  return isAddress(putativeBlockhash);
}
function getCommitmentScore(commitment) {
  switch (commitment) {
    case "finalized":
      return 2;
    case "confirmed":
      return 1;
    case "processed":
      return 0;
    default:
      throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE, {
        unexpectedValue: commitment
      });
  }
}
function commitmentComparator(a, b) {
  if (a === b) {
    return 0;
  }
  return getCommitmentScore(a) < getCommitmentScore(b) ? -1 : 1;
}
var maxU64Value = 18446744073709551615n;
function assertIsLamports(putativeLamports) {
  if (putativeLamports < 0 || putativeLamports > maxU64Value) {
    throw new SolanaError(SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE);
  }
}
function lamports(putativeLamports) {
  assertIsLamports(putativeLamports);
  return putativeLamports;
}

// ../kit/packages/transaction-messages/dist/index.node.mjs
function isTransactionMessageWithBlockhashLifetime(transactionMessage) {
  return "lifetimeConstraint" in transactionMessage && typeof transactionMessage.lifetimeConstraint.blockhash === "string" && typeof transactionMessage.lifetimeConstraint.lastValidBlockHeight === "bigint" && isBlockhash(transactionMessage.lifetimeConstraint.blockhash);
}
function setTransactionMessageLifetimeUsingBlockhash(blockhashLifetimeConstraint, transactionMessage) {
  if ("lifetimeConstraint" in transactionMessage && transactionMessage.lifetimeConstraint && "blockhash" in transactionMessage.lifetimeConstraint && transactionMessage.lifetimeConstraint.blockhash === blockhashLifetimeConstraint.blockhash && transactionMessage.lifetimeConstraint.lastValidBlockHeight === blockhashLifetimeConstraint.lastValidBlockHeight) {
    return transactionMessage;
  }
  return Object.freeze({
    ...transactionMessage,
    lifetimeConstraint: Object.freeze(blockhashLifetimeConstraint)
  });
}
var MAX_SUPPORTED_TRANSACTION_VERSION = 1;
var memoizedU8Encoder;
function getMemoizedU8Encoder() {
  if (!memoizedU8Encoder) memoizedU8Encoder = getU8Encoder();
  return memoizedU8Encoder;
}
function getMessageHeaderEncoder() {
  return getStructEncoder([
    ["numSignerAccounts", getMemoizedU8Encoder()],
    ["numReadonlySignerAccounts", getMemoizedU8Encoder()],
    ["numReadonlyNonSignerAccounts", getMemoizedU8Encoder()]
  ]);
}
var memoizedGetInstructionEncoder;
function getInstructionEncoder() {
  if (!memoizedGetInstructionEncoder) {
    memoizedGetInstructionEncoder = transformEncoder(
      getStructEncoder([
        ["programAddressIndex", getU8Encoder()],
        ["accountIndices", getArrayEncoder(getU8Encoder(), { size: getShortU16Encoder() })],
        ["data", addEncoderSizePrefix(getBytesEncoder(), getShortU16Encoder())]
      ]),
      // Convert an instruction to have all fields defined
      (instruction) => {
        if (instruction.accountIndices !== void 0 && instruction.data !== void 0) {
          return instruction;
        }
        return {
          ...instruction,
          accountIndices: instruction.accountIndices ?? [],
          data: instruction.data ?? new Uint8Array(0)
        };
      }
    );
  }
  return memoizedGetInstructionEncoder;
}
function assertValidBaseString2(alphabet4, testValue, givenValue = testValue) {
  if (!testValue.match(new RegExp(`^[${alphabet4}]*$`))) {
    throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
      alphabet: alphabet4,
      base: alphabet4.length,
      value: givenValue
    });
  }
}
var getBaseXEncoder2 = (alphabet4) => {
  return createEncoder({
    getSizeFromValue: (value) => {
      const [leadingZeroes, tailChars] = partitionLeadingZeroes2(value, alphabet4[0]);
      if (!tailChars) return value.length;
      const base10Number = getBigIntFromBaseX2(tailChars, alphabet4);
      return leadingZeroes.length + Math.ceil(base10Number.toString(16).length / 2);
    },
    write(value, bytes, offset) {
      assertValidBaseString2(alphabet4, value);
      if (value === "") return offset;
      const [leadingZeroes, tailChars] = partitionLeadingZeroes2(value, alphabet4[0]);
      if (!tailChars) {
        bytes.set(new Uint8Array(leadingZeroes.length).fill(0), offset);
        return offset + leadingZeroes.length;
      }
      let base10Number = getBigIntFromBaseX2(tailChars, alphabet4);
      const tailBytes = [];
      while (base10Number > 0n) {
        tailBytes.unshift(Number(base10Number % 256n));
        base10Number /= 256n;
      }
      const bytesToAdd = [...Array(leadingZeroes.length).fill(0), ...tailBytes];
      bytes.set(bytesToAdd, offset);
      return offset + bytesToAdd.length;
    }
  });
};
function partitionLeadingZeroes2(value, zeroCharacter) {
  const [leadingZeros, tailChars] = value.split(new RegExp(`((?!${zeroCharacter}).*)`));
  return [leadingZeros, tailChars];
}
function getBigIntFromBaseX2(value, alphabet4) {
  const base = BigInt(alphabet4.length);
  let sum = 0n;
  for (const char of value) {
    sum *= base;
    sum += BigInt(alphabet4.indexOf(char));
  }
  return sum;
}
var alphabet22 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var getBase58Encoder2 = () => getBaseXEncoder2(alphabet22);
function getLifetimeTokenEncoder() {
  return transformEncoder(
    getNullableEncoder(fixEncoderSize(getBase58Encoder2(), 32), {
      noneValue: "zeroes",
      prefix: null
    }),
    (token) => token ?? null
  );
}
function getMessageEncoder() {
  return transformEncoder(
    getStructEncoder([
      ["header", getMessageHeaderEncoder()],
      ["staticAccounts", getArrayEncoder(getAddressEncoder(), { size: getShortU16Encoder() })],
      ["lifetimeToken", getLifetimeTokenEncoder()],
      ["instructions", getArrayEncoder(getInstructionEncoder(), { size: getShortU16Encoder() })]
    ]),
    (value) => ({
      ...value,
      lifetimeToken: "lifetimeToken" in value ? value.lifetimeToken : void 0
    })
  );
}
var VERSION_FLAG_MASK = 128;
function getTransactionVersionEncoder() {
  return createEncoder({
    getSizeFromValue: (value) => value === "legacy" ? 0 : 1,
    maxSize: 1,
    write: (value, bytes, offset) => {
      if (value === "legacy") {
        return offset;
      }
      if (value < 0 || value > 127) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_OUT_OF_RANGE, {
          actualVersion: value
        });
      }
      if (value > MAX_SUPPORTED_TRANSACTION_VERSION) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
          unsupportedVersion: value
        });
      }
      bytes.set([value | VERSION_FLAG_MASK], offset);
      return offset + 1;
    }
  });
}
function getTransactionVersionDecoder() {
  return createDecoder({
    maxSize: 1,
    read: (bytes, offset) => {
      const firstByte = bytes[offset];
      if ((firstByte & VERSION_FLAG_MASK) === 0) {
        return ["legacy", offset];
      } else {
        const version = firstByte ^ VERSION_FLAG_MASK;
        if (version > MAX_SUPPORTED_TRANSACTION_VERSION) {
          throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
            unsupportedVersion: version
          });
        }
        return [version, offset + 1];
      }
    }
  });
}
var memoizedAddressTableLookupEncoder;
function getAddressTableLookupEncoder() {
  if (!memoizedAddressTableLookupEncoder) {
    const indexEncoder = getArrayEncoder(getU8Encoder(), { size: getShortU16Encoder() });
    memoizedAddressTableLookupEncoder = getStructEncoder([
      ["lookupTableAddress", getAddressEncoder()],
      ["writableIndexes", indexEncoder],
      ["readonlyIndexes", indexEncoder]
    ]);
  }
  return memoizedAddressTableLookupEncoder;
}
function getMessageEncoder2() {
  return transformEncoder(
    getStructEncoder([
      ["version", getTransactionVersionEncoder()],
      ["header", getMessageHeaderEncoder()],
      ["staticAccounts", getArrayEncoder(getAddressEncoder(), { size: getShortU16Encoder() })],
      ["lifetimeToken", getLifetimeTokenEncoder()],
      ["instructions", getArrayEncoder(getInstructionEncoder(), { size: getShortU16Encoder() })],
      ["addressTableLookups", getArrayEncoder(getAddressTableLookupEncoder(), { size: getShortU16Encoder() })]
    ]),
    (value) => ({
      ...value,
      addressTableLookups: value.addressTableLookups ?? [],
      lifetimeToken: "lifetimeToken" in value ? value.lifetimeToken : void 0
    })
  );
}
var TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK = 3;
var TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK = 4;
var TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK = 8;
var TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK = 16;
function getCompiledTransactionConfigValueEncoder() {
  return getPatternMatchEncoder([
    [(value) => value.kind === "u32", getStructEncoder([["value", getU32Encoder()]])],
    [(value) => value.kind === "u64", getStructEncoder([["value", getU64Encoder()]])]
  ]);
}
function getCompiledTransactionConfigValuesEncoder() {
  return getArrayEncoder(getCompiledTransactionConfigValueEncoder(), { size: "remainder" });
}
function getInstructionHeaderEncoder() {
  return getStructEncoder([
    ["programAccountIndex", getU8Encoder()],
    ["numInstructionAccounts", getU8Encoder()],
    ["numInstructionDataBytes", getU16Encoder()]
  ]);
}
function getInstructionPayloadEncoder() {
  return getStructEncoder([
    ["instructionAccountIndices", getArrayEncoder(getU8Encoder(), { size: "remainder" })],
    ["instructionData", getBytesEncoder()]
  ]);
}
function getMessageEncoder3() {
  return transformEncoder(
    getStructEncoder([
      ["version", getTransactionVersionEncoder()],
      ["header", getMessageHeaderEncoder()],
      ["configMask", getU32Encoder()],
      ["lifetimeToken", getLifetimeTokenEncoder()],
      ["numInstructions", getU8Encoder()],
      ["numStaticAccounts", getU8Encoder()],
      ["staticAccounts", getArrayEncoder(getAddressEncoder(), { size: "remainder" })],
      ["configValues", getCompiledTransactionConfigValuesEncoder()],
      ["instructionHeaders", getArrayEncoder(getInstructionHeaderEncoder(), { size: "remainder" })],
      ["instructionPayloads", getArrayEncoder(getInstructionPayloadEncoder(), { size: "remainder" })]
    ]),
    (value) => ({
      ...value,
      lifetimeToken: "lifetimeToken" in value ? value.lifetimeToken : void 0
    })
  );
}
function getCompiledTransactionMessageEncoder() {
  return transformEncoder(
    getPatternMatchEncoder([
      [(m) => m.version === "legacy", getMessageEncoder()],
      [(m) => m.version === 0, getMessageEncoder2()],
      [(m) => m.version === 1, getMessageEncoder3()]
    ]),
    (value) => {
      if (value.version !== "legacy" && value.version > MAX_SUPPORTED_TRANSACTION_VERSION) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
          unsupportedVersion: value.version
        });
      }
      return value;
    }
  );
}
function upsert(addressMap, address2, update) {
  addressMap[address2] = update(addressMap[address2] ?? { role: AccountRole.READONLY });
}
var TYPE2 = /* @__PURE__ */ Symbol("AddressMapTypeProperty");
function getAddressMapFromInstructions(feePayer, instructions) {
  const addressMap = {
    [feePayer]: { [TYPE2]: 0, role: AccountRole.WRITABLE_SIGNER }
  };
  const addressesOfInvokedPrograms = /* @__PURE__ */ new Set();
  for (const instruction of instructions) {
    upsert(addressMap, instruction.programAddress, (entry) => {
      addressesOfInvokedPrograms.add(instruction.programAddress);
      if (TYPE2 in entry) {
        if (isWritableRole(entry.role)) {
          switch (entry[TYPE2]) {
            case 0:
              throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_CANNOT_PAY_FEES, {
                programAddress: instruction.programAddress
              });
            default:
              throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE, {
                programAddress: instruction.programAddress
              });
          }
        }
        if (entry[TYPE2] === 1) {
          return entry;
        }
      }
      return { [TYPE2]: 1, role: AccountRole.READONLY };
    });
    if (!instruction.accounts) {
      continue;
    }
    for (const account of instruction.accounts) {
      upsert(addressMap, account.address, (entry) => {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          address: _,
          ...accountMeta
        } = account;
        if (TYPE2 in entry) {
          switch (entry[TYPE2]) {
            case 0:
              return entry;
            case 1: {
              const nextRole = mergeRoles(entry.role, accountMeta.role);
              if (
                // Check to see if this address represents a program that is invoked
                // in this transaction.
                addressesOfInvokedPrograms.has(account.address)
              ) {
                if (isWritableRole(accountMeta.role)) {
                  throw new SolanaError(
                    SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE,
                    {
                      programAddress: account.address
                    }
                  );
                }
                if (entry.role !== nextRole) {
                  return {
                    ...entry,
                    role: nextRole
                  };
                } else {
                  return entry;
                }
              } else {
                if (entry.role !== nextRole) {
                  return {
                    ...entry,
                    role: nextRole
                  };
                } else {
                  return entry;
                }
              }
            }
          }
        }
        return {
          ...accountMeta,
          [TYPE2]: 1
          /* STATIC */
        };
      });
    }
  }
  return addressMap;
}
function getOrderedAccountsFromAddressMap(addressMap) {
  let addressComparator;
  const orderedAccounts = Object.entries(addressMap).sort(([leftAddress, leftEntry], [rightAddress, rightEntry]) => {
    if (leftEntry[TYPE2] !== rightEntry[TYPE2]) {
      if (leftEntry[TYPE2] === 0) {
        return -1;
      } else if (rightEntry[TYPE2] === 0) {
        return 1;
      } else if (leftEntry[TYPE2] === 1) {
        return -1;
      } else if (rightEntry[TYPE2] === 1) {
        return 1;
      }
    }
    const leftIsSigner = isSignerRole(leftEntry.role);
    if (leftIsSigner !== isSignerRole(rightEntry.role)) {
      return leftIsSigner ? -1 : 1;
    }
    const leftIsWritable = isWritableRole(leftEntry.role);
    if (leftIsWritable !== isWritableRole(rightEntry.role)) {
      return leftIsWritable ? -1 : 1;
    }
    addressComparator ||= getAddressComparator();
    return addressComparator(leftAddress, rightAddress);
  }).map(([address2, addressMeta]) => ({
    address: address2,
    ...addressMeta
  }));
  return orderedAccounts;
}
function getCompiledMessageHeader(orderedAccounts) {
  let numReadonlyNonSignerAccounts = 0;
  let numReadonlySignerAccounts = 0;
  let numSignerAccounts = 0;
  for (const account of orderedAccounts) {
    if ("lookupTableAddress" in account) {
      break;
    }
    const accountIsWritable = isWritableRole(account.role);
    if (isSignerRole(account.role)) {
      numSignerAccounts++;
      if (!accountIsWritable) {
        numReadonlySignerAccounts++;
      }
    } else if (!accountIsWritable) {
      numReadonlyNonSignerAccounts++;
    }
  }
  return {
    numReadonlyNonSignerAccounts,
    numReadonlySignerAccounts,
    numSignerAccounts
  };
}
function getAccountIndex(orderedAccounts) {
  const out = {};
  for (const [index, account] of orderedAccounts.entries()) {
    out[account.address] = index;
  }
  return out;
}
function getCompiledInstructions(instructions, orderedAccounts) {
  const accountIndex = getAccountIndex(orderedAccounts);
  return instructions.map(({ accounts, data, programAddress }) => {
    return {
      programAddressIndex: accountIndex[programAddress],
      ...accounts ? { accountIndices: accounts.map(({ address: address2 }) => accountIndex[address2]) } : null,
      ...data ? { data } : null
    };
  });
}
function getCompiledLifetimeToken(lifetimeConstraint) {
  if ("nonce" in lifetimeConstraint) {
    return lifetimeConstraint.nonce;
  }
  return lifetimeConstraint.blockhash;
}
function compileTransactionMessage(transactionMessage) {
  const addressMap = getAddressMapFromInstructions(
    transactionMessage.feePayer.address,
    transactionMessage.instructions
  );
  const orderedAccounts = getOrderedAccountsFromAddressMap(addressMap);
  const numAccounts = orderedAccounts.length;
  if (numAccounts > 64) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES, {
      actualCount: numAccounts,
      maxAllowed: 64
    });
  }
  const numSigners = orderedAccounts.filter((account) => isSignerRole(account.role)).length;
  if (numSigners > 12) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES, {
      actualCount: numSigners,
      maxAllowed: 12
    });
  }
  const numInstructions = transactionMessage.instructions.length;
  if (numInstructions > 64) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS, {
      actualCount: numInstructions,
      maxAllowed: 64
    });
  }
  for (let i = 0; i < transactionMessage.instructions.length; i++) {
    const numAccountsInInstruction = transactionMessage.instructions[i].accounts?.length ?? 0;
    if (numAccountsInInstruction > 255) {
      throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
        actualCount: numAccountsInInstruction,
        instructionIndex: i,
        maxAllowed: 255
      });
    }
  }
  const lifetimeConstraint = transactionMessage.lifetimeConstraint;
  return {
    ...lifetimeConstraint ? { lifetimeToken: getCompiledLifetimeToken(lifetimeConstraint) } : null,
    header: getCompiledMessageHeader(orderedAccounts),
    instructions: getCompiledInstructions(transactionMessage.instructions, orderedAccounts),
    staticAccounts: orderedAccounts.map((account) => account.address),
    version: transactionMessage.version
  };
}
function upsert2(addressMap, address2, update) {
  addressMap[address2] = update(addressMap[address2] ?? { role: AccountRole.READONLY });
}
var TYPE22 = /* @__PURE__ */ Symbol("AddressMapTypeProperty");
function getAddressMapFromInstructions2(feePayer, instructions) {
  const addressMap = {
    [feePayer]: { [TYPE22]: 0, role: AccountRole.WRITABLE_SIGNER }
  };
  const addressesOfInvokedPrograms = /* @__PURE__ */ new Set();
  for (const instruction of instructions) {
    upsert2(addressMap, instruction.programAddress, (entry) => {
      addressesOfInvokedPrograms.add(instruction.programAddress);
      if (TYPE22 in entry) {
        if (isWritableRole(entry.role)) {
          switch (entry[TYPE22]) {
            case 0:
              throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_CANNOT_PAY_FEES, {
                programAddress: instruction.programAddress
              });
            default:
              throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE, {
                programAddress: instruction.programAddress
              });
          }
        }
        if (entry[TYPE22] === 2) {
          return entry;
        }
      }
      return { [TYPE22]: 2, role: AccountRole.READONLY };
    });
    let addressComparator;
    if (!instruction.accounts) {
      continue;
    }
    for (const account of instruction.accounts) {
      upsert2(addressMap, account.address, (entry) => {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          address: _,
          ...accountMeta
        } = account;
        if (TYPE22 in entry) {
          switch (entry[TYPE22]) {
            case 0:
              return entry;
            case 1: {
              const nextRole = mergeRoles(entry.role, accountMeta.role);
              if ("lookupTableAddress" in accountMeta) {
                const shouldReplaceEntry = (
                  // Consider using the new LOOKUP_TABLE if its address is different...
                  entry.lookupTableAddress !== accountMeta.lookupTableAddress && // ...and sorts before the existing one.
                  (addressComparator ||= getAddressComparator())(
                    accountMeta.lookupTableAddress,
                    entry.lookupTableAddress
                  ) < 0
                );
                if (shouldReplaceEntry) {
                  return {
                    [TYPE22]: 1,
                    ...accountMeta,
                    role: nextRole
                  };
                }
              } else if (isSignerRole(accountMeta.role)) {
                return {
                  [TYPE22]: 2,
                  role: nextRole
                };
              }
              if (entry.role !== nextRole) {
                return {
                  ...entry,
                  role: nextRole
                };
              } else {
                return entry;
              }
            }
            case 2: {
              const nextRole = mergeRoles(entry.role, accountMeta.role);
              if (
                // Check to see if this address represents a program that is invoked
                // in this transaction.
                addressesOfInvokedPrograms.has(account.address)
              ) {
                if (isWritableRole(accountMeta.role)) {
                  throw new SolanaError(
                    SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE,
                    {
                      programAddress: account.address
                    }
                  );
                }
                if (entry.role !== nextRole) {
                  return {
                    ...entry,
                    role: nextRole
                  };
                } else {
                  return entry;
                }
              } else if ("lookupTableAddress" in accountMeta && // Static accounts can be 'upgraded' to lookup table accounts as
              // long as they are not require to sign the transaction.
              !isSignerRole(entry.role)) {
                return {
                  ...accountMeta,
                  [TYPE22]: 1,
                  role: nextRole
                };
              } else {
                if (entry.role !== nextRole) {
                  return {
                    ...entry,
                    role: nextRole
                  };
                } else {
                  return entry;
                }
              }
            }
          }
        }
        if ("lookupTableAddress" in accountMeta) {
          return {
            ...accountMeta,
            [TYPE22]: 1
            /* LOOKUP_TABLE */
          };
        } else {
          return {
            ...accountMeta,
            [TYPE22]: 2
            /* STATIC */
          };
        }
      });
    }
  }
  return addressMap;
}
function getOrderedAccountsFromAddressMap2(addressMap) {
  let addressComparator;
  const orderedAccounts = Object.entries(addressMap).sort(([leftAddress, leftEntry], [rightAddress, rightEntry]) => {
    if (leftEntry[TYPE22] !== rightEntry[TYPE22]) {
      if (leftEntry[TYPE22] === 0) {
        return -1;
      } else if (rightEntry[TYPE22] === 0) {
        return 1;
      } else if (leftEntry[TYPE22] === 2) {
        return -1;
      } else if (rightEntry[TYPE22] === 2) {
        return 1;
      }
    }
    const leftIsSigner = isSignerRole(leftEntry.role);
    if (leftIsSigner !== isSignerRole(rightEntry.role)) {
      return leftIsSigner ? -1 : 1;
    }
    const leftIsWritable = isWritableRole(leftEntry.role);
    if (leftIsWritable !== isWritableRole(rightEntry.role)) {
      return leftIsWritable ? -1 : 1;
    }
    addressComparator ||= getAddressComparator();
    if (leftEntry[TYPE22] === 1 && rightEntry[TYPE22] === 1 && leftEntry.lookupTableAddress !== rightEntry.lookupTableAddress) {
      return addressComparator(leftEntry.lookupTableAddress, rightEntry.lookupTableAddress);
    } else {
      return addressComparator(leftAddress, rightAddress);
    }
  }).map(([address2, addressMeta]) => ({
    address: address2,
    ...addressMeta
  }));
  return orderedAccounts;
}
function getCompiledAddressTableLookups(orderedAccounts) {
  const index = {};
  for (const account of orderedAccounts) {
    if (!("lookupTableAddress" in account)) {
      continue;
    }
    const entry = index[account.lookupTableAddress] ||= {
      readonlyIndexes: [],
      writableIndexes: []
    };
    if (account.role === AccountRole.WRITABLE) {
      entry.writableIndexes.push(account.addressIndex);
    } else {
      entry.readonlyIndexes.push(account.addressIndex);
    }
  }
  return Object.keys(index).sort(getAddressComparator()).map((lookupTableAddress) => ({
    lookupTableAddress,
    ...index[lookupTableAddress]
  }));
}
function getAccountIndex2(orderedAccounts) {
  const out = {};
  for (const [index, account] of orderedAccounts.entries()) {
    out[account.address] = index;
  }
  return out;
}
function getCompiledInstructions2(instructions, orderedAccounts) {
  const accountIndex = getAccountIndex2(orderedAccounts);
  return instructions.map(({ accounts, data, programAddress }) => {
    return {
      programAddressIndex: accountIndex[programAddress],
      ...accounts ? { accountIndices: accounts.map(({ address: address2 }) => accountIndex[address2]) } : null,
      ...data ? { data } : null
    };
  });
}
function getCompiledStaticAccounts(orderedAccounts) {
  const firstLookupTableAccountIndex = orderedAccounts.findIndex((account) => "lookupTableAddress" in account);
  const orderedStaticAccounts = firstLookupTableAccountIndex === -1 ? orderedAccounts : orderedAccounts.slice(0, firstLookupTableAccountIndex);
  return orderedStaticAccounts.map(({ address: address2 }) => address2);
}
function compileTransactionMessage2(transactionMessage) {
  const addressMap = getAddressMapFromInstructions2(
    transactionMessage.feePayer.address,
    transactionMessage.instructions
  );
  const orderedAccounts = getOrderedAccountsFromAddressMap2(addressMap);
  const numAccounts = orderedAccounts.length;
  if (numAccounts > 64) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES, {
      actualCount: numAccounts,
      maxAllowed: 64
    });
  }
  const numSigners = orderedAccounts.filter((account) => isSignerRole(account.role)).length;
  if (numSigners > 12) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES, {
      actualCount: numSigners,
      maxAllowed: 12
    });
  }
  const numInstructions = transactionMessage.instructions.length;
  if (numInstructions > 64) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS, {
      actualCount: numInstructions,
      maxAllowed: 64
    });
  }
  for (let i = 0; i < transactionMessage.instructions.length; i++) {
    const numAccountsInInstruction = transactionMessage.instructions[i].accounts?.length ?? 0;
    if (numAccountsInInstruction > 255) {
      throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
        actualCount: numAccountsInInstruction,
        instructionIndex: i,
        maxAllowed: 255
      });
    }
  }
  const lifetimeConstraint = transactionMessage.lifetimeConstraint;
  return {
    addressTableLookups: getCompiledAddressTableLookups(orderedAccounts),
    ...lifetimeConstraint ? { lifetimeToken: getCompiledLifetimeToken(lifetimeConstraint) } : null,
    header: getCompiledMessageHeader(orderedAccounts),
    instructions: getCompiledInstructions2(transactionMessage.instructions, orderedAccounts),
    staticAccounts: getCompiledStaticAccounts(orderedAccounts),
    version: transactionMessage.version
  };
}
function getTransactionConfigMask(config) {
  let mask = 0;
  if (config.priorityFeeLamports !== void 0) mask |= TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK;
  if (config.computeUnitLimit !== void 0) mask |= TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK;
  if (config.loadedAccountsDataSizeLimit !== void 0)
    mask |= TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK;
  if (config.heapSize !== void 0) mask |= TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK;
  return mask;
}
function getTransactionConfigValues(config) {
  const values = [];
  if (config.priorityFeeLamports !== void 0) {
    values.push({ kind: "u64", value: config.priorityFeeLamports });
  }
  if (config.computeUnitLimit !== void 0) {
    values.push({ kind: "u32", value: config.computeUnitLimit });
  }
  if (config.loadedAccountsDataSizeLimit !== void 0) {
    values.push({ kind: "u32", value: config.loadedAccountsDataSizeLimit });
  }
  if (config.heapSize !== void 0) {
    values.push({ kind: "u32", value: config.heapSize });
  }
  return values;
}
function getInstructionHeader(instruction, accountIndex) {
  return {
    numInstructionAccounts: instruction.accounts?.length ?? 0,
    numInstructionDataBytes: instruction.data?.byteLength ?? 0,
    programAccountIndex: accountIndex[instruction.programAddress]
  };
}
function getInstructionPayload(instruction, accountIndex) {
  return {
    instructionAccountIndices: instruction.accounts?.map(({ address: address2 }) => accountIndex[address2]) ?? [],
    instructionData: instruction.data ?? new Uint8Array()
  };
}
function compileTransactionMessage3(transactionMessage) {
  const addressMap = getAddressMapFromInstructions(
    transactionMessage.feePayer.address,
    transactionMessage.instructions
  );
  const orderedAccounts = getOrderedAccountsFromAddressMap(addressMap);
  const numAccounts = orderedAccounts.length;
  if (numAccounts > 64) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES, {
      actualCount: numAccounts,
      maxAllowed: 64
    });
  }
  const numSigners = orderedAccounts.filter((account) => isSignerRole(account.role)).length;
  if (numSigners > 12) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES, {
      actualCount: numSigners,
      maxAllowed: 12
    });
  }
  const numInstructions = transactionMessage.instructions.length;
  if (numInstructions > 64) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS, {
      actualCount: numInstructions,
      maxAllowed: 64
    });
  }
  for (let i = 0; i < transactionMessage.instructions.length; i++) {
    const numAccountsInInstruction = transactionMessage.instructions[i].accounts?.length ?? 0;
    if (numAccountsInInstruction > 255) {
      throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
        actualCount: numAccountsInInstruction,
        instructionIndex: i,
        maxAllowed: 255
      });
    }
  }
  const accountIndex = getAccountIndex(orderedAccounts);
  const lifetimeConstraint = transactionMessage.lifetimeConstraint;
  return {
    version: 1,
    ...lifetimeConstraint ? { lifetimeToken: getCompiledLifetimeToken(lifetimeConstraint) } : null,
    configMask: getTransactionConfigMask(transactionMessage.config ?? {}),
    configValues: getTransactionConfigValues(transactionMessage.config ?? {}),
    header: getCompiledMessageHeader(orderedAccounts),
    instructionHeaders: transactionMessage.instructions.map(
      (instruction) => getInstructionHeader(instruction, accountIndex)
    ),
    instructionPayloads: transactionMessage.instructions.map(
      (instruction) => getInstructionPayload(instruction, accountIndex)
    ),
    numInstructions: transactionMessage.instructions.length,
    numStaticAccounts: orderedAccounts.length,
    staticAccounts: orderedAccounts.map((account) => account.address)
  };
}
function compileTransactionMessage4(transactionMessage) {
  const version = transactionMessage.version;
  if (version === "legacy") {
    return compileTransactionMessage(transactionMessage);
  } else if (version === 0) {
    return compileTransactionMessage2(transactionMessage);
  } else if (version === 1) {
    return compileTransactionMessage3(transactionMessage);
  } else {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
      version
    });
  }
}
function appendTransactionMessageInstruction(instruction, transactionMessage) {
  return appendTransactionMessageInstructions([instruction], transactionMessage);
}
function appendTransactionMessageInstructions(instructions, transactionMessage) {
  return Object.freeze({
    ...transactionMessage,
    instructions: Object.freeze([
      ...transactionMessage.instructions,
      ...instructions
    ])
  });
}
function createTransactionMessage(config) {
  return Object.freeze({
    instructions: Object.freeze([]),
    version: config.version
  });
}
function setTransactionMessageFeePayer(feePayer, transactionMessage) {
  if ("feePayer" in transactionMessage && feePayer === transactionMessage.feePayer?.address && isAddressOnlyFeePayer(transactionMessage.feePayer)) {
    return transactionMessage;
  }
  const out = {
    ...transactionMessage,
    feePayer: Object.freeze({ address: feePayer })
  };
  Object.freeze(out);
  return out;
}
function isAddressOnlyFeePayer(feePayer) {
  return !!feePayer && "address" in feePayer && typeof feePayer.address === "string" && Object.keys(feePayer).length === 1;
}
var RECENT_BLOCKHASHES_SYSVAR_ADDRESS = "SysvarRecentB1ockHashes11111111111111111111";
var SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111";
function isAdvanceNonceAccountInstruction(instruction) {
  return instruction.programAddress === SYSTEM_PROGRAM_ADDRESS && // Test for `AdvanceNonceAccount` instruction data
  instruction.data != null && isAdvanceNonceAccountInstructionData(instruction.data) && // Test for exactly 3 accounts
  instruction.accounts?.length === 3 && // First account is nonce account address
  instruction.accounts[0].address != null && instruction.accounts[0].role === AccountRole.WRITABLE && // Second account is recent blockhashes sysvar
  instruction.accounts[1].address === RECENT_BLOCKHASHES_SYSVAR_ADDRESS && instruction.accounts[1].role === AccountRole.READONLY && // Third account is nonce authority account
  instruction.accounts[2].address != null && isSignerRole(instruction.accounts[2].role);
}
function isAdvanceNonceAccountInstructionData(data) {
  return data.byteLength === 4 && data[0] === 4 && data[1] === 0 && data[2] === 0 && data[3] === 0;
}
function isTransactionMessageWithDurableNonceLifetime(transactionMessage) {
  return "lifetimeConstraint" in transactionMessage && typeof transactionMessage.lifetimeConstraint.nonce === "string" && transactionMessage.instructions[0] != null && isAdvanceNonceAccountInstruction(transactionMessage.instructions[0]);
}

// ../kit/packages/promises/dist/index.node.mjs
function isObject(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}
function addRaceContender(contender) {
  const deferreds = /* @__PURE__ */ new Set();
  const record = { deferreds, settled: false };
  Promise.resolve(contender).then(
    (value) => {
      for (const { resolve } of deferreds) {
        resolve(value);
      }
      deferreds.clear();
      record.settled = true;
    },
    (err) => {
      for (const { reject } of deferreds) {
        reject(err);
      }
      deferreds.clear();
      record.settled = true;
    }
  );
  return record;
}
var wm = /* @__PURE__ */ new WeakMap();
async function safeRace(contenders) {
  let deferred;
  const result = new Promise((resolve, reject) => {
    deferred = { reject, resolve };
    for (const contender of contenders) {
      if (!isObject(contender)) {
        Promise.resolve(contender).then(resolve, reject);
        continue;
      }
      let record = wm.get(contender);
      if (record === void 0) {
        record = addRaceContender(contender);
        record.deferreds.add(deferred);
        wm.set(contender, record);
      } else if (record.settled) {
        Promise.resolve(contender).then(resolve, reject);
      } else {
        record.deferreds.add(deferred);
      }
    }
  });
  return await result.finally(() => {
    for (const contender of contenders) {
      if (isObject(contender)) {
        const record = wm.get(contender);
        record.deferreds.delete(deferred);
      }
    }
  });
}

// ../kit/packages/keys/dist/index.node.mjs
var ED25519_ALGORITHM_IDENTIFIER = (
  // Resist the temptation to convert this to a simple string; As of version 133.0.3, Firefox
  // requires the object form of `AlgorithmIdentifier` and will throw a `DOMException` otherwise.
  Object.freeze({ name: "Ed25519" })
);
async function signBytes(key, data) {
  assertSigningCapabilityIsAvailable();
  const signedData = await crypto.subtle.sign(ED25519_ALGORITHM_IDENTIFIER, key, toArrayBuffer(data));
  return new Uint8Array(signedData);
}
async function generateKeyPair(extractable = false) {
  await assertKeyGenerationIsAvailable();
  const keyPair = await crypto.subtle.generateKey(
    /* algorithm */
    ED25519_ALGORITHM_IDENTIFIER,
    // Native implementation status: https://github.com/WICG/webcrypto-secure-curves/issues/20
    extractable,
    /* allowed uses */
    ["sign", "verify"]
  );
  return keyPair;
}

// ../kit/packages/transactions/dist/index.node.mjs
function getSignaturesToEncode(signaturesMap) {
  const signatures = Object.values(signaturesMap);
  if (signatures.length === 0) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES);
  }
  return signatures.map((signature) => {
    if (!signature) {
      return new Uint8Array(64).fill(0);
    }
    return signature;
  });
}
function getSignaturesEncoderWithSizePrefix() {
  return transformEncoder(
    getArrayEncoder(fixEncoderSize(getBytesEncoder(), 64), { size: getShortU16Encoder() }),
    getSignaturesToEncode
  );
}
function getSignaturesEncoderWithLength(size) {
  return transformEncoder(
    getArrayEncoder(fixEncoderSize(getBytesEncoder(), 64), { description: "signatures", size }),
    getSignaturesToEncode
  );
}
function getEnvelopeShapeFromMessageBytes(messageBytes) {
  if (messageBytes.length === 0) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_MESSAGE_BYTES);
  }
  const version = getTransactionVersionDecoder().decode(messageBytes);
  return version === 1 ? "messageFirst" : "signaturesFirst";
}
function getTransactionEncoder() {
  return getPredicateEncoder(
    (transaction) => getEnvelopeShapeFromMessageBytes(transaction.messageBytes) === "signaturesFirst",
    getTransactionEncoderWithSignaturesFirst(),
    getTransactionEncoderWithMessageFirst()
  );
}
function getTransactionEncoderWithSignaturesFirst() {
  return getStructEncoder([
    ["signatures", getSignaturesEncoderWithSizePrefix()],
    ["messageBytes", getBytesEncoder()]
  ]);
}
function getSignatureCountForVersionedOrThrow(messageBytes, offset) {
  if (messageBytes.length < offset + 2) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES, {
      messageBytes
    });
  }
  return messageBytes[offset + 1];
}
function getTransactionEncoderWithMessageFirst() {
  const bytesEncoder = getBytesEncoder();
  return createEncoder({
    getSizeFromValue: (transaction) => {
      const signatureCount = getSignatureCountForVersionedOrThrow(transaction.messageBytes, 0);
      return transaction.messageBytes.length + signatureCount * 64;
    },
    write: (transaction, bytes, offset) => {
      offset = bytesEncoder.write(transaction.messageBytes, bytes, offset);
      const signatureCount = getSignatureCountForVersionedOrThrow(transaction.messageBytes, 0);
      const signaturesEncoder = getSignaturesEncoderWithLength(signatureCount);
      offset = signaturesEncoder.write(transaction.signatures, bytes, offset);
      return offset;
    }
  });
}
function compileTransaction(transactionMessage) {
  const compiledMessage = compileTransactionMessage4(transactionMessage);
  const messageBytes = getCompiledTransactionMessageEncoder().encode(compiledMessage);
  const transactionSigners = compiledMessage.staticAccounts.slice(0, compiledMessage.header.numSignerAccounts);
  const signatures = {};
  for (const signerAddress of transactionSigners) {
    signatures[signerAddress] = null;
  }
  let lifetimeConstraint;
  if (isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
    lifetimeConstraint = {
      blockhash: transactionMessage.lifetimeConstraint.blockhash,
      lastValidBlockHeight: transactionMessage.lifetimeConstraint.lastValidBlockHeight
    };
  } else if (isTransactionMessageWithDurableNonceLifetime(transactionMessage)) {
    lifetimeConstraint = {
      nonce: transactionMessage.lifetimeConstraint.nonce,
      nonceAccountAddress: transactionMessage.instructions[0].accounts[0].address
    };
  }
  return Object.freeze({
    ...lifetimeConstraint ? { lifetimeConstraint } : void 0,
    messageBytes,
    signatures: Object.freeze(signatures)
  });
}
var base58Decoder;
function getSignatureFromTransaction(transaction) {
  if (!base58Decoder) base58Decoder = getBase58Decoder();
  const signatureBytes = Object.values(transaction.signatures)[0];
  if (!signatureBytes) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING);
  }
  const transactionSignature = base58Decoder.decode(signatureBytes);
  return transactionSignature;
}
async function partiallySignTransaction(keyPairs, transaction) {
  let newSignatures;
  let unexpectedSigners;
  await Promise.all(
    keyPairs.map(async (keyPair) => {
      const address2 = await getAddressFromPublicKey(keyPair.publicKey);
      const existingSignature = transaction.signatures[address2];
      if (existingSignature === void 0) {
        unexpectedSigners ||= /* @__PURE__ */ new Set();
        unexpectedSigners.add(address2);
        return;
      }
      if (unexpectedSigners) {
        return;
      }
      const newSignature = await signBytes(keyPair.privateKey, transaction.messageBytes);
      if (existingSignature !== null && bytesEqual(newSignature, existingSignature)) {
        return;
      }
      newSignatures ||= {};
      newSignatures[address2] = newSignature;
    })
  );
  if (unexpectedSigners && unexpectedSigners.size > 0) {
    const expectedSigners = Object.keys(transaction.signatures);
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION, {
      expectedAddresses: expectedSigners,
      unexpectedAddresses: [...unexpectedSigners]
    });
  }
  if (!newSignatures) {
    return transaction;
  }
  return Object.freeze({
    ...transaction,
    signatures: Object.freeze({
      ...transaction.signatures,
      ...newSignatures
    })
  });
}
function assertIsFullySignedTransaction(transaction) {
  const missingSigs = [];
  Object.entries(transaction.signatures).forEach(([address2, signatureBytes]) => {
    if (!signatureBytes) {
      missingSigs.push(address2);
    }
  });
  if (missingSigs.length > 0) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING, {
      addresses: missingSigs
    });
  }
}
function getBase64EncodedWireTransaction(transaction) {
  const wireTransactionBytes = getTransactionEncoder().encode(transaction);
  return getBase64Decoder().decode(wireTransactionBytes);
}
var TRANSACTION_PACKET_SIZE = 1280;
var TRANSACTION_PACKET_HEADER = 40 + 8;
var TRANSACTION_SIZE_LIMIT = TRANSACTION_PACKET_SIZE - TRANSACTION_PACKET_HEADER;

// ../kit/packages/rpc-spec-types/dist/index.node.mjs
function parseJsonWithBigInts(json) {
  return JSON.parse(wrapIntegersInBigIntValueObject(json), (_, value) => {
    return isBigIntValueObject(value) ? unwrapBigIntValueObject(value) : value;
  });
}
function wrapIntegersInBigIntValueObject(json) {
  const out = [];
  let inQuote = false;
  for (let ii = 0; ii < json.length; ii++) {
    let isEscaped = false;
    if (json[ii] === "\\") {
      out.push(json[ii++]);
      isEscaped = !isEscaped;
    }
    if (json[ii] === '"') {
      out.push(json[ii]);
      if (!isEscaped) {
        inQuote = !inQuote;
      }
      continue;
    }
    if (!inQuote) {
      const consumedNumber = consumeNumber(json, ii);
      if (consumedNumber?.length) {
        ii += consumedNumber.length - 1;
        if (consumedNumber.match(/\.|[eE]-/)) {
          out.push(consumedNumber);
        } else {
          out.push(wrapBigIntValueObject(consumedNumber));
        }
        continue;
      }
    }
    out.push(json[ii]);
  }
  return out.join("");
}
function consumeNumber(json, ii) {
  const JSON_NUMBER_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
  if (!json[ii]?.match(/[-\d]/)) {
    return null;
  }
  const numberMatch = json.slice(ii).match(JSON_NUMBER_REGEX);
  return numberMatch ? numberMatch[0] : null;
}
function wrapBigIntValueObject(value) {
  return `{"$n":"${value}"}`;
}
function unwrapBigIntValueObject({ $n }) {
  if ($n.match(/[eE]/)) {
    const [units, exponent] = $n.split(/[eE]/);
    return BigInt(units) * BigInt(10) ** BigInt(exponent);
  }
  return BigInt($n);
}
function isBigIntValueObject(value) {
  return !!value && typeof value === "object" && "$n" in value && typeof value.$n === "string";
}
var _nextMessageId = 0n;
function getNextMessageId() {
  const id = _nextMessageId;
  _nextMessageId++;
  return id.toString();
}
function createRpcMessage(request) {
  return {
    id: getNextMessageId(),
    jsonrpc: "2.0",
    method: request.methodName,
    params: request.params
  };
}
function stringifyJsonWithBigInts(value, space) {
  return unwrapBigIntValueObject2(
    JSON.stringify(value, (_, v) => typeof v === "bigint" ? wrapBigIntValueObject2(v) : v, space)
  );
}
function wrapBigIntValueObject2(value) {
  return { $n: `${value}` };
}
function unwrapBigIntValueObject2(value) {
  return value.replace(/\{\s*"\$n"\s*:\s*"(-?\d+)"\s*\}/g, "$1");
}

// ../kit/packages/rpc-spec/dist/index.node.mjs
function createRpc(rpcConfig) {
  return makeProxy(rpcConfig);
}
function makeProxy(rpcConfig) {
  return new Proxy(rpcConfig.api, {
    defineProperty() {
      return false;
    },
    deleteProperty() {
      return false;
    },
    get(target, p, receiver) {
      if (p === "then") {
        return void 0;
      }
      return function(...rawParams) {
        const methodName = p.toString();
        const getApiPlan = Reflect.get(target, methodName, receiver);
        if (!getApiPlan) {
          throw new SolanaError(SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD, {
            method: methodName,
            params: rawParams
          });
        }
        const apiPlan = getApiPlan(...rawParams);
        return createPendingRpcRequest(rpcConfig, apiPlan);
      };
    }
  });
}
function createPendingRpcRequest({ transport }, plan) {
  return {
    async send(options) {
      return await plan.execute({ signal: options?.abortSignal, transport });
    }
  };
}
function createJsonRpcApi(config) {
  return new Proxy({}, {
    defineProperty() {
      return false;
    },
    deleteProperty() {
      return false;
    },
    get(...args) {
      const [_, p] = args;
      const methodName = p.toString();
      return function(...rawParams) {
        const rawRequest = Object.freeze({ methodName, params: rawParams });
        const request = config?.requestTransformer ? config?.requestTransformer(rawRequest) : rawRequest;
        return Object.freeze({
          execute: async ({ signal, transport }) => {
            const payload = createRpcMessage(request);
            const response = await transport({ payload, signal });
            if (!config?.responseTransformer) {
              return response;
            }
            return config.responseTransformer(response, request);
          }
        });
      };
    }
  });
}
function isJsonRpcPayload(payload) {
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  return "jsonrpc" in payload && payload.jsonrpc === "2.0" && "method" in payload && typeof payload.method === "string" && "params" in payload;
}

// ../kit/packages/rpc-transformers/dist/index.node.mjs
function downcastNodeToNumberIfBigint(value) {
  return typeof value === "bigint" ? (
    // FIXME(solana-labs/solana/issues/30341) Create a data type to represent u64 in the Solana
    // JSON RPC implementation so that we can throw away this entire patcher instead of unsafely
    // downcasting `bigints` to `numbers`.
    Number(value)
  ) : value;
}
var KEYPATH_WILDCARD = {};
function getTreeWalker(visitors) {
  return function traverse(node, state) {
    if (Array.isArray(node)) {
      return node.map((element, ii) => {
        const nextState = {
          ...state,
          keyPath: [...state.keyPath, ii]
        };
        return traverse(element, nextState);
      });
    } else if (typeof node === "object" && node !== null) {
      const out = {};
      for (const propName in node) {
        if (!Object.prototype.hasOwnProperty.call(node, propName)) {
          continue;
        }
        const nextState = {
          ...state,
          keyPath: [...state.keyPath, propName]
        };
        out[propName] = traverse(node[propName], nextState);
      }
      return out;
    } else {
      return visitors.reduce((acc, visitNode) => visitNode(acc, state), node);
    }
  };
}
function getTreeWalkerRequestTransformer(visitors, initialState) {
  return (request) => {
    const traverse = getTreeWalker(visitors);
    return Object.freeze({
      ...request,
      params: traverse(request.params, initialState)
    });
  };
}
function getTreeWalkerResponseTransformer(visitors, initialState) {
  return (json) => getTreeWalker(visitors)(json, initialState);
}
function getBigIntDowncastRequestTransformer() {
  return getTreeWalkerRequestTransformer([downcastNodeToNumberIfBigint], { keyPath: [] });
}
function applyDefaultCommitment({
  commitmentPropertyName,
  params,
  optionsObjectPositionInParams,
  overrideCommitment
}) {
  const paramInTargetPosition = params[optionsObjectPositionInParams];
  if (
    // There's no config.
    paramInTargetPosition === void 0 || // There is a config object.
    paramInTargetPosition && typeof paramInTargetPosition === "object" && !Array.isArray(paramInTargetPosition)
  ) {
    if (
      // The config object already has a commitment set.
      paramInTargetPosition && commitmentPropertyName in paramInTargetPosition
    ) {
      if (!paramInTargetPosition[commitmentPropertyName] || paramInTargetPosition[commitmentPropertyName] === "finalized") {
        const nextParams = [...params];
        const {
          [commitmentPropertyName]: _,
          // eslint-disable-line @typescript-eslint/no-unused-vars
          ...rest
        } = paramInTargetPosition;
        if (Object.keys(rest).length > 0) {
          nextParams[optionsObjectPositionInParams] = rest;
        } else {
          if (optionsObjectPositionInParams === nextParams.length - 1) {
            nextParams.length--;
          } else {
            nextParams[optionsObjectPositionInParams] = void 0;
          }
        }
        return nextParams;
      }
    } else if (overrideCommitment !== "finalized") {
      const nextParams = [...params];
      nextParams[optionsObjectPositionInParams] = {
        ...paramInTargetPosition,
        [commitmentPropertyName]: overrideCommitment
      };
      return nextParams;
    }
  }
  return params;
}
function getDefaultCommitmentRequestTransformer({
  defaultCommitment,
  optionsObjectPositionByMethod
}) {
  return (request) => {
    const { params, methodName } = request;
    if (!Array.isArray(params)) {
      return request;
    }
    const optionsObjectPositionInParams = optionsObjectPositionByMethod[methodName];
    if (optionsObjectPositionInParams == null) {
      return request;
    }
    return Object.freeze({
      methodName,
      params: applyDefaultCommitment({
        commitmentPropertyName: methodName === "sendTransaction" ? "preflightCommitment" : "commitment",
        optionsObjectPositionInParams,
        overrideCommitment: defaultCommitment,
        params
      })
    });
  };
}
function getIntegerOverflowNodeVisitor(onIntegerOverflow) {
  return (value, { keyPath }) => {
    if (typeof value === "bigint") {
      if (onIntegerOverflow && (value > Number.MAX_SAFE_INTEGER || value < -Number.MAX_SAFE_INTEGER)) {
        onIntegerOverflow(keyPath, value);
      }
    }
    return value;
  };
}
function getIntegerOverflowRequestTransformer(onIntegerOverflow) {
  return (request) => {
    const transformer = getTreeWalkerRequestTransformer(
      [getIntegerOverflowNodeVisitor((...args) => onIntegerOverflow(request, ...args))],
      { keyPath: [] }
    );
    return transformer(request);
  };
}
var OPTIONS_OBJECT_POSITION_BY_METHOD = {
  accountNotifications: 1,
  blockNotifications: 1,
  getAccountInfo: 1,
  getBalance: 1,
  getBlock: 1,
  getBlockHeight: 0,
  getBlockProduction: 0,
  getBlocks: 2,
  getBlocksWithLimit: 2,
  getEpochInfo: 0,
  getFeeForMessage: 1,
  getInflationGovernor: 0,
  getInflationReward: 1,
  getLargestAccounts: 0,
  getLatestBlockhash: 0,
  getLeaderSchedule: 1,
  getMinimumBalanceForRentExemption: 1,
  getMultipleAccounts: 1,
  getProgramAccounts: 1,
  getSignaturesForAddress: 1,
  getSlot: 0,
  getSlotLeader: 0,
  getStakeMinimumDelegation: 0,
  getSupply: 0,
  getTokenAccountBalance: 1,
  getTokenAccountsByDelegate: 2,
  getTokenAccountsByOwner: 2,
  getTokenLargestAccounts: 1,
  getTokenSupply: 1,
  getTransaction: 1,
  getTransactionCount: 0,
  getVoteAccounts: 0,
  isBlockhashValid: 1,
  logsNotifications: 1,
  programNotifications: 1,
  requestAirdrop: 2,
  sendTransaction: 1,
  signatureNotifications: 1,
  simulateTransaction: 1
};
function getDefaultRequestTransformerForSolanaRpc(config) {
  const handleIntegerOverflow = config?.onIntegerOverflow;
  return (request) => {
    return pipe(
      request,
      handleIntegerOverflow ? getIntegerOverflowRequestTransformer(handleIntegerOverflow) : (r) => r,
      getBigIntDowncastRequestTransformer(),
      getDefaultCommitmentRequestTransformer({
        defaultCommitment: config?.defaultCommitment,
        optionsObjectPositionByMethod: OPTIONS_OBJECT_POSITION_BY_METHOD
      })
    );
  };
}
function getBigIntUpcastVisitor(allowedNumericKeyPaths) {
  return function upcastNodeToBigIntIfNumber(value, { keyPath }) {
    const isInteger = typeof value === "number" && Number.isInteger(value) || typeof value === "bigint";
    if (!isInteger) return value;
    if (keyPathIsAllowedToBeNumeric(keyPath, allowedNumericKeyPaths)) {
      return Number(value);
    } else {
      return BigInt(value);
    }
  };
}
function keyPathIsAllowedToBeNumeric(keyPath, allowedNumericKeyPaths) {
  return allowedNumericKeyPaths.some((prohibitedKeyPath) => {
    if (prohibitedKeyPath.length !== keyPath.length) {
      return false;
    }
    for (let ii = keyPath.length - 1; ii >= 0; ii--) {
      const keyPathPart = keyPath[ii];
      const prohibitedKeyPathPart = prohibitedKeyPath[ii];
      if (prohibitedKeyPathPart !== keyPathPart && (prohibitedKeyPathPart !== KEYPATH_WILDCARD || typeof keyPathPart !== "number")) {
        return false;
      }
    }
    return true;
  });
}
function getBigIntUpcastResponseTransformer(allowedNumericKeyPaths) {
  return getTreeWalkerResponseTransformer([getBigIntUpcastVisitor(allowedNumericKeyPaths)], { keyPath: [] });
}
function getResultResponseTransformer() {
  return (json) => json.result;
}
var jsonParsedTokenAccountsConfigs = [
  // parsed Token/Token22 token account
  ["data", "parsed", "info", "tokenAmount", "decimals"],
  ["data", "parsed", "info", "tokenAmount", "uiAmount"],
  ["data", "parsed", "info", "rentExemptReserve", "decimals"],
  ["data", "parsed", "info", "rentExemptReserve", "uiAmount"],
  ["data", "parsed", "info", "delegatedAmount", "decimals"],
  ["data", "parsed", "info", "delegatedAmount", "uiAmount"],
  ["data", "parsed", "info", "extensions", KEYPATH_WILDCARD, "state", "olderTransferFee", "transferFeeBasisPoints"],
  ["data", "parsed", "info", "extensions", KEYPATH_WILDCARD, "state", "newerTransferFee", "transferFeeBasisPoints"],
  ["data", "parsed", "info", "extensions", KEYPATH_WILDCARD, "state", "preUpdateAverageRate"],
  ["data", "parsed", "info", "extensions", KEYPATH_WILDCARD, "state", "currentRate"]
];
var jsonParsedAccountsConfigs = [
  ...jsonParsedTokenAccountsConfigs,
  // parsed AddressTableLookup account
  ["data", "parsed", "info", "lastExtendedSlotStartIndex"],
  // parsed Config account
  ["data", "parsed", "info", "slashPenalty"],
  ["data", "parsed", "info", "warmupCooldownRate"],
  // parsed Token/Token22 mint account
  ["data", "parsed", "info", "decimals"],
  // parsed Token/Token22 multisig account
  ["data", "parsed", "info", "numRequiredSigners"],
  ["data", "parsed", "info", "numValidSigners"],
  // parsed Stake account
  ["data", "parsed", "info", "stake", "delegation", "warmupCooldownRate"],
  // parsed Sysvar rent account
  ["data", "parsed", "info", "exemptionThreshold"],
  ["data", "parsed", "info", "burnPercent"],
  // parsed Vote account
  ["data", "parsed", "info", "commission"],
  ["data", "parsed", "info", "votes", KEYPATH_WILDCARD, "confirmationCount"]
];
var innerInstructionsConfigs = [
  ["index"],
  ["instructions", KEYPATH_WILDCARD, "accounts", KEYPATH_WILDCARD],
  ["instructions", KEYPATH_WILDCARD, "programIdIndex"],
  ["instructions", KEYPATH_WILDCARD, "stackHeight"]
];
var messageConfig = [
  ["addressTableLookups", KEYPATH_WILDCARD, "writableIndexes", KEYPATH_WILDCARD],
  ["addressTableLookups", KEYPATH_WILDCARD, "readonlyIndexes", KEYPATH_WILDCARD],
  ["header", "numReadonlySignedAccounts"],
  ["header", "numReadonlyUnsignedAccounts"],
  ["header", "numRequiredSignatures"],
  ["instructions", KEYPATH_WILDCARD, "accounts", KEYPATH_WILDCARD],
  ["instructions", KEYPATH_WILDCARD, "programIdIndex"],
  ["instructions", KEYPATH_WILDCARD, "stackHeight"]
];
function getSimulateTransactionAllowedNumericKeypaths() {
  return [
    ["loadedAccountsDataSize"],
    ...jsonParsedAccountsConfigs.map((c) => ["accounts", KEYPATH_WILDCARD, ...c]),
    ...innerInstructionsConfigs.map((c) => ["innerInstructions", KEYPATH_WILDCARD, ...c])
  ];
}
function getThrowSolanaErrorResponseTransformer() {
  return (json, request) => {
    const jsonRpcResponse = json;
    if ("error" in jsonRpcResponse) {
      const { error } = jsonRpcResponse;
      const isSendTransactionPreflightFailure = error && typeof error === "object" && "code" in error && (error.code === -32002 || error.code === -32002n);
      if (isSendTransactionPreflightFailure && "data" in error && error.data) {
        const treeWalker = getTreeWalkerResponseTransformer(
          [getBigIntUpcastVisitor(getSimulateTransactionAllowedNumericKeypaths())],
          { keyPath: [] }
        );
        const transformedData = treeWalker(error.data, request);
        const transformedError = { ...error, data: transformedData };
        throw getSolanaErrorFromJsonRpcError(transformedError);
      }
      throw getSolanaErrorFromJsonRpcError(jsonRpcResponse.error);
    }
    return jsonRpcResponse;
  };
}
function getDefaultResponseTransformerForSolanaRpc(config) {
  return (response, request) => {
    const methodName = request.methodName;
    const keyPaths = config?.allowedNumericKeyPaths && methodName ? config.allowedNumericKeyPaths[methodName] : void 0;
    return pipe(
      response,
      (r) => getThrowSolanaErrorResponseTransformer()(r, request),
      (r) => getResultResponseTransformer()(r, request),
      (r) => getBigIntUpcastResponseTransformer(keyPaths ?? [])(r, request)
    );
  };
}
function getDefaultResponseTransformerForSolanaRpcSubscriptions(config) {
  return (response, request) => {
    const methodName = request.methodName;
    const keyPaths = config?.allowedNumericKeyPaths && methodName ? config.allowedNumericKeyPaths[methodName] : void 0;
    return pipe(response, (r) => getBigIntUpcastResponseTransformer(keyPaths ?? [])(r, request));
  };
}

// ../kit/packages/rpc-api/dist/index.node.mjs
function createSolanaRpcApi(config) {
  return createJsonRpcApi({
    requestTransformer: getDefaultRequestTransformerForSolanaRpc(config),
    responseTransformer: getDefaultResponseTransformerForSolanaRpc({
      allowedNumericKeyPaths: getAllowedNumericKeypaths()
    })
  });
}
var memoizedKeypaths;
function getAllowedNumericKeypaths() {
  if (!memoizedKeypaths) {
    memoizedKeypaths = {
      getAccountInfo: jsonParsedAccountsConfigs.map((c) => ["value", ...c]),
      getBlock: [
        ["transactions", KEYPATH_WILDCARD, "meta", "preTokenBalances", KEYPATH_WILDCARD, "accountIndex"],
        [
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "preTokenBalances",
          KEYPATH_WILDCARD,
          "uiTokenAmount",
          "decimals"
        ],
        ["transactions", KEYPATH_WILDCARD, "meta", "postTokenBalances", KEYPATH_WILDCARD, "accountIndex"],
        [
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "postTokenBalances",
          KEYPATH_WILDCARD,
          "uiTokenAmount",
          "decimals"
        ],
        ["transactions", KEYPATH_WILDCARD, "meta", "rewards", KEYPATH_WILDCARD, "commission"],
        ...innerInstructionsConfigs.map((c) => [
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "innerInstructions",
          KEYPATH_WILDCARD,
          ...c
        ]),
        ...messageConfig.map((c) => ["transactions", KEYPATH_WILDCARD, "transaction", "message", ...c]),
        ["rewards", KEYPATH_WILDCARD, "commission"]
      ],
      getClusterNodes: [
        [KEYPATH_WILDCARD, "featureSet"],
        [KEYPATH_WILDCARD, "shredVersion"]
      ],
      getInflationGovernor: [["initial"], ["foundation"], ["foundationTerm"], ["taper"], ["terminal"]],
      getInflationRate: [["foundation"], ["total"], ["validator"]],
      getInflationReward: [[KEYPATH_WILDCARD, "commission"]],
      getMultipleAccounts: jsonParsedAccountsConfigs.map((c) => ["value", KEYPATH_WILDCARD, ...c]),
      getProgramAccounts: jsonParsedAccountsConfigs.flatMap((c) => [
        ["value", KEYPATH_WILDCARD, "account", ...c],
        [KEYPATH_WILDCARD, "account", ...c]
      ]),
      getRecentPerformanceSamples: [[KEYPATH_WILDCARD, "samplePeriodSecs"]],
      getTokenAccountBalance: [
        ["value", "decimals"],
        ["value", "uiAmount"]
      ],
      getTokenAccountsByDelegate: jsonParsedTokenAccountsConfigs.map((c) => [
        "value",
        KEYPATH_WILDCARD,
        "account",
        ...c
      ]),
      getTokenAccountsByOwner: jsonParsedTokenAccountsConfigs.map((c) => [
        "value",
        KEYPATH_WILDCARD,
        "account",
        ...c
      ]),
      getTokenLargestAccounts: [
        ["value", KEYPATH_WILDCARD, "decimals"],
        ["value", KEYPATH_WILDCARD, "uiAmount"]
      ],
      getTokenSupply: [
        ["value", "decimals"],
        ["value", "uiAmount"]
      ],
      getTransaction: [
        ["meta", "preTokenBalances", KEYPATH_WILDCARD, "accountIndex"],
        ["meta", "preTokenBalances", KEYPATH_WILDCARD, "uiTokenAmount", "decimals"],
        ["meta", "postTokenBalances", KEYPATH_WILDCARD, "accountIndex"],
        ["meta", "postTokenBalances", KEYPATH_WILDCARD, "uiTokenAmount", "decimals"],
        ["meta", "rewards", KEYPATH_WILDCARD, "commission"],
        ...innerInstructionsConfigs.map((c) => ["meta", "innerInstructions", KEYPATH_WILDCARD, ...c]),
        ...messageConfig.map((c) => ["transaction", "message", ...c])
      ],
      getVersion: [["feature-set"]],
      getVoteAccounts: [
        ["current", KEYPATH_WILDCARD, "commission"],
        ["delinquent", KEYPATH_WILDCARD, "commission"]
      ],
      simulateTransaction: [
        ["value", "loadedAccountsDataSize"],
        ...jsonParsedAccountsConfigs.map((c) => ["value", "accounts", KEYPATH_WILDCARD, ...c]),
        ...innerInstructionsConfigs.map((c) => ["value", "innerInstructions", KEYPATH_WILDCARD, ...c])
      ]
    };
  }
  return memoizedKeypaths;
}

// ../kit/packages/rpc-transport-http/dist/index.node.mjs
var DISALLOWED_HEADERS = {
  accept: true,
  "content-length": true,
  "content-type": true
};
var FORBIDDEN_HEADERS = /* @__PURE__ */ Object.assign(
  {
    "accept-charset": true,
    "access-control-request-headers": true,
    "access-control-request-method": true,
    connection: true,
    "content-length": true,
    cookie: true,
    date: true,
    dnt: true,
    expect: true,
    host: true,
    "keep-alive": true,
    "permissions-policy": true,
    // Prefix matching is implemented in code, below.
    // 'proxy-': true,
    // 'sec-': true,
    referer: true,
    te: true,
    trailer: true,
    "transfer-encoding": true,
    upgrade: true,
    via: true
  },
  void 0,
  void 0
);
function assertIsAllowedHttpRequestHeaders(headers) {
  const badHeaders = Object.keys(headers).filter((headerName) => {
    const lowercaseHeaderName = headerName.toLowerCase();
    return DISALLOWED_HEADERS[headerName.toLowerCase()] === true || FORBIDDEN_HEADERS[headerName.toLowerCase()] === true || lowercaseHeaderName.startsWith("proxy-") || lowercaseHeaderName.startsWith("sec-");
  });
  if (badHeaders.length > 0) {
    throw new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_HEADER_FORBIDDEN, {
      headers: badHeaders
    });
  }
}
function normalizeHeaders(headers) {
  const out = {};
  for (const headerName in headers) {
    out[headerName.toLowerCase()] = headers[headerName];
  }
  return out;
}
function createHttpTransport(config) {
  if (process.env.NODE_ENV !== "production" && false) ;
  const { fromJson, headers, toJson, url } = config;
  if (process.env.NODE_ENV !== "production" && headers) {
    assertIsAllowedHttpRequestHeaders(headers);
  }
  let dispatcherConfig;
  if ("dispatcher_NODE_ONLY" in config) {
    dispatcherConfig = { dispatcher: config.dispatcher_NODE_ONLY };
  }
  const customHeaders = headers && normalizeHeaders(headers);
  return async function makeHttpRequest({
    payload,
    signal
  }) {
    const body = toJson ? toJson(payload) : JSON.stringify(payload);
    const requestInfo = {
      ...dispatcherConfig,
      body,
      headers: {
        ...customHeaders,
        // Keep these headers lowercase so they will override any user-supplied headers above.
        accept: "application/json",
        "content-length": body.length.toString(),
        "content-type": "application/json; charset=utf-8"
      },
      method: "POST",
      signal
    };
    const response = await fetch(url, requestInfo);
    if (!response.ok) {
      throw new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
        headers: response.headers,
        message: response.statusText,
        statusCode: response.status
      });
    }
    if (fromJson) {
      return fromJson(await response.text(), payload);
    }
    return await response.json();
  };
}
var SOLANA_RPC_METHODS = [
  "getAccountInfo",
  "getBalance",
  "getBlock",
  "getBlockCommitment",
  "getBlockHeight",
  "getBlockProduction",
  "getBlocks",
  "getBlocksWithLimit",
  "getBlockTime",
  "getClusterNodes",
  "getEpochInfo",
  "getEpochSchedule",
  "getFeeForMessage",
  "getFirstAvailableBlock",
  "getGenesisHash",
  "getHealth",
  "getHighestSnapshotSlot",
  "getIdentity",
  "getInflationGovernor",
  "getInflationRate",
  "getInflationReward",
  "getLargestAccounts",
  "getLatestBlockhash",
  "getLeaderSchedule",
  "getMaxRetransmitSlot",
  "getMaxShredInsertSlot",
  "getMinimumBalanceForRentExemption",
  "getMultipleAccounts",
  "getProgramAccounts",
  "getRecentPerformanceSamples",
  "getRecentPrioritizationFees",
  "getSignaturesForAddress",
  "getSignatureStatuses",
  "getSlot",
  "getSlotLeader",
  "getSlotLeaders",
  "getStakeMinimumDelegation",
  "getSupply",
  "getTokenAccountBalance",
  "getTokenAccountsByDelegate",
  "getTokenAccountsByOwner",
  "getTokenLargestAccounts",
  "getTokenSupply",
  "getTransaction",
  "getTransactionCount",
  "getVersion",
  "getVoteAccounts",
  "index",
  "isBlockhashValid",
  "minimumLedgerSlot",
  "requestAirdrop",
  "sendTransaction",
  "simulateTransaction"
];
function isSolanaRequest(payload) {
  return isJsonRpcPayload(payload) && SOLANA_RPC_METHODS.includes(payload.method);
}
function createHttpTransportForSolanaRpc(config) {
  return createHttpTransport({
    ...config,
    fromJson: (rawResponse, payload) => isSolanaRequest(payload) ? parseJsonWithBigInts(rawResponse) : JSON.parse(rawResponse),
    toJson: (payload) => isSolanaRequest(payload) ? stringifyJsonWithBigInts(payload) : JSON.stringify(payload)
  });
}

// ../kit/packages/rpc/dist/index.node.mjs
var import_events = require("events");

// ../kit/packages/fast-stable-stringify/dist/index.node.mjs
var objToString = Object.prototype.toString;
var objKeys = Object.keys || function(obj) {
  const keys = [];
  for (const name in obj) {
    keys.push(name);
  }
  return keys;
};
function stringify(val, isArrayProp) {
  let i, max, str, keys, key, propVal, toStr;
  if (val === true) {
    return "true";
  }
  if (val === false) {
    return "false";
  }
  switch (typeof val) {
    case "object":
      if (val === null) {
        return null;
      } else if ("toJSON" in val && typeof val.toJSON === "function") {
        return stringify(val.toJSON(), isArrayProp);
      } else {
        toStr = objToString.call(val);
        if (toStr === "[object Array]") {
          str = "[";
          max = val.length - 1;
          for (i = 0; i < max; i++) {
            str += stringify(val[i], true) + ",";
          }
          if (max > -1) {
            str += stringify(val[i], true);
          }
          return str + "]";
        } else if (toStr === "[object Object]") {
          keys = objKeys(val).sort();
          max = keys.length;
          str = "";
          i = 0;
          while (i < max) {
            key = keys[i];
            propVal = stringify(val[key], false);
            if (propVal !== void 0) {
              if (str) {
                str += ",";
              }
              str += JSON.stringify(key) + ":" + propVal;
            }
            i++;
          }
          return "{" + str + "}";
        } else {
          return JSON.stringify(val);
        }
      }
    case "function":
    case "undefined":
      return isArrayProp ? null : void 0;
    case "bigint":
      return `${val.toString()}n`;
    case "string":
      return JSON.stringify(val);
    default:
      return isFinite(val) ? val : null;
  }
}
function index_default(val) {
  const returnVal = stringify(val, false);
  if (returnVal !== void 0) {
    return "" + returnVal;
  }
}

// ../kit/packages/rpc/dist/index.node.mjs
function createSolanaJsonRpcIntegerOverflowError(methodName, keyPath, value) {
  let argumentLabel = "";
  if (typeof keyPath[0] === "number") {
    const argPosition = keyPath[0] + 1;
    const lastDigit = argPosition % 10;
    const lastTwoDigits = argPosition % 100;
    if (lastDigit == 1 && lastTwoDigits != 11) {
      argumentLabel = argPosition + "st";
    } else if (lastDigit == 2 && lastTwoDigits != 12) {
      argumentLabel = argPosition + "nd";
    } else if (lastDigit == 3 && lastTwoDigits != 13) {
      argumentLabel = argPosition + "rd";
    } else {
      argumentLabel = argPosition + "th";
    }
  } else {
    argumentLabel = `\`${keyPath[0].toString()}\``;
  }
  const path = keyPath.length > 1 ? keyPath.slice(1).map((pathPart) => typeof pathPart === "number" ? `[${pathPart}]` : pathPart).join(".") : void 0;
  const error = new SolanaError(SOLANA_ERROR__RPC__INTEGER_OVERFLOW, {
    argumentLabel,
    keyPath,
    methodName,
    optionalPathLabel: path ? ` at path \`${path}\`` : "",
    value,
    ...path !== void 0 ? { path } : void 0
  });
  safeCaptureStackTrace(error, createSolanaJsonRpcIntegerOverflowError);
  return error;
}
var DEFAULT_RPC_CONFIG = {
  defaultCommitment: "confirmed",
  onIntegerOverflow(request, keyPath, value) {
    throw createSolanaJsonRpcIntegerOverflowError(request.methodName, keyPath, value);
  }
};
var e2 = class extends globalThis.AbortController {
  constructor(...t) {
    super(...t), (0, import_events.setMaxListeners)(Number.MAX_SAFE_INTEGER, this.signal);
  }
};
var EXPLICIT_ABORT_TOKEN;
function createExplicitAbortToken() {
  return process.env.NODE_ENV !== "production" ? {
    EXPLICIT_ABORT_TOKEN: "This object is thrown from the request that underlies a series of coalesced requests when the last request in that series aborts"
  } : {};
}
function getRpcTransportWithRequestCoalescing(transport, getDeduplicationKey) {
  let coalescedRequestsByDeduplicationKey;
  return async function makeCoalescedHttpRequest(request) {
    const { payload, signal } = request;
    const deduplicationKey = getDeduplicationKey(payload);
    if (deduplicationKey === void 0) {
      return await transport(request);
    }
    if (!coalescedRequestsByDeduplicationKey) {
      queueMicrotask(() => {
        coalescedRequestsByDeduplicationKey = void 0;
      });
      coalescedRequestsByDeduplicationKey = {};
    }
    if (coalescedRequestsByDeduplicationKey[deduplicationKey] == null) {
      const abortController = new e2();
      const responsePromise = (async () => {
        try {
          return await transport({
            ...request,
            signal: abortController.signal
          });
        } catch (e22) {
          if (e22 === (EXPLICIT_ABORT_TOKEN ||= createExplicitAbortToken())) {
            return;
          }
          throw e22;
        }
      })();
      coalescedRequestsByDeduplicationKey[deduplicationKey] = {
        abortController,
        numConsumers: 0,
        responsePromise
      };
    }
    const coalescedRequest = coalescedRequestsByDeduplicationKey[deduplicationKey];
    coalescedRequest.numConsumers++;
    if (signal) {
      const responsePromise = coalescedRequest.responsePromise;
      return await new Promise((resolve, reject) => {
        const handleAbort = (e22) => {
          signal.removeEventListener("abort", handleAbort);
          coalescedRequest.numConsumers -= 1;
          queueMicrotask(() => {
            if (coalescedRequest.numConsumers === 0) {
              const abortController = coalescedRequest.abortController;
              abortController.abort(EXPLICIT_ABORT_TOKEN ||= createExplicitAbortToken());
            }
          });
          reject(e22.target.reason);
        };
        signal.addEventListener("abort", handleAbort);
        responsePromise.then(resolve).catch(reject).finally(() => {
          signal.removeEventListener("abort", handleAbort);
        });
      });
    } else {
      return await coalescedRequest.responsePromise;
    }
  };
}
function getSolanaRpcPayloadDeduplicationKey(payload) {
  return isJsonRpcPayload(payload) ? index_default([payload.method, payload.params]) : void 0;
}
function normalizeHeaders2(headers) {
  const out = {};
  for (const headerName in headers) {
    out[headerName.toLowerCase()] = headers[headerName];
  }
  return out;
}
function createDefaultRpcTransport(config) {
  return pipe(
    createHttpTransportForSolanaRpc({
      ...config,
      headers: {
        ...{
          // Keep these headers lowercase so they will be overridden by any user-supplied headers below.
          "accept-encoding": (
            // Natively supported by Node LTS v20.18.0 and above.
            "br,gzip,deflate"
          )
          // Brotli, gzip, and Deflate, in that order.
        },
        ...config.headers ? normalizeHeaders2(config.headers) : void 0,
        ...{
          // Keep these headers lowercase so they will override any user-supplied headers above.
          "solana-client": `js/${"6.8.0"}`
        }
      }
    }),
    (transport) => getRpcTransportWithRequestCoalescing(transport, getSolanaRpcPayloadDeduplicationKey)
  );
}
function createSolanaRpc(clusterUrl, config) {
  return createSolanaRpcFromTransport(createDefaultRpcTransport({ url: clusterUrl, ...config }));
}
function createSolanaRpcFromTransport(transport) {
  return createRpc({
    api: createSolanaRpcApi(DEFAULT_RPC_CONFIG),
    transport
  });
}

// ../kit/packages/subscribable/dist/index.node.mjs
var import_events2 = require("events");
var e3 = class extends globalThis.AbortController {
  constructor(...t) {
    super(...t), (0, import_events2.setMaxListeners)(Number.MAX_SAFE_INTEGER, this.signal);
  }
};
var s = class extends globalThis.EventTarget {
  constructor(...t) {
    super(...t), (0, import_events2.setMaxListeners)(Number.MAX_SAFE_INTEGER, this);
  }
};
var EXPLICIT_ABORT_TOKEN2;
function createExplicitAbortToken2() {
  return /* @__PURE__ */ Symbol(
    process.env.NODE_ENV !== "production" ? "This symbol is thrown from a socket's iterator when the connection is explicitly aborted by the user" : void 0
  );
}
var UNINITIALIZED = /* @__PURE__ */ Symbol();
function createAsyncIterableFromDataPublisher({
  abortSignal,
  dataChannelName,
  dataPublisher,
  errorChannelName
}) {
  const iteratorState = /* @__PURE__ */ new Map();
  function publishErrorToAllIterators(reason) {
    for (const [iteratorKey, state] of iteratorState.entries()) {
      if (state.__hasPolled) {
        iteratorState.delete(iteratorKey);
        state.onError(reason);
      } else {
        state.publishQueue.push({
          __type: 1,
          err: reason
        });
      }
    }
  }
  const abortController = new e3();
  abortSignal.addEventListener("abort", () => {
    abortController.abort();
    publishErrorToAllIterators(EXPLICIT_ABORT_TOKEN2 ||= createExplicitAbortToken2());
  });
  const options = { signal: abortController.signal };
  let firstError = UNINITIALIZED;
  dataPublisher.on(
    errorChannelName,
    (err) => {
      if (firstError === UNINITIALIZED) {
        firstError = err;
        abortController.abort();
        publishErrorToAllIterators(err);
      }
    },
    options
  );
  dataPublisher.on(
    dataChannelName,
    (data) => {
      iteratorState.forEach((state, iteratorKey) => {
        if (state.__hasPolled) {
          const { onData } = state;
          iteratorState.set(iteratorKey, { __hasPolled: false, publishQueue: [] });
          onData(data);
        } else {
          state.publishQueue.push({
            __type: 0,
            data
          });
        }
      });
    },
    options
  );
  return {
    async *[Symbol.asyncIterator]() {
      if (abortSignal.aborted) {
        return;
      }
      if (firstError !== UNINITIALIZED) {
        throw firstError;
      }
      const iteratorKey = /* @__PURE__ */ Symbol();
      iteratorState.set(iteratorKey, { __hasPolled: false, publishQueue: [] });
      try {
        while (true) {
          const state = iteratorState.get(iteratorKey);
          if (!state) {
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_STATE_MISSING);
          }
          if (state.__hasPolled) {
            throw new SolanaError(
              SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_MUST_NOT_POLL_BEFORE_RESOLVING_EXISTING_MESSAGE_PROMISE
            );
          }
          const publishQueue = state.publishQueue;
          try {
            if (publishQueue.length) {
              state.publishQueue = [];
              for (const item of publishQueue) {
                if (item.__type === 0) {
                  yield item.data;
                } else {
                  throw item.err;
                }
              }
            } else {
              yield await new Promise((resolve, reject) => {
                iteratorState.set(iteratorKey, {
                  __hasPolled: true,
                  onData: resolve,
                  onError: reject
                });
              });
            }
          } catch (e22) {
            if (e22 === (EXPLICIT_ABORT_TOKEN2 ||= createExplicitAbortToken2())) {
              return;
            } else {
              throw e22;
            }
          }
        }
      } finally {
        iteratorState.delete(iteratorKey);
      }
    }
  };
}
function getDataPublisherFromEventEmitter(eventEmitter) {
  return {
    on(channelName, subscriber, options) {
      function innerListener(ev) {
        if (ev instanceof CustomEvent) {
          const data = ev.detail;
          subscriber(data);
        } else {
          subscriber();
        }
      }
      eventEmitter.addEventListener(channelName, innerListener, options);
      return () => {
        eventEmitter.removeEventListener(channelName, innerListener);
      };
    }
  };
}
function demultiplexDataPublisher(publisher, sourceChannelName, messageTransformer) {
  let innerPublisherState;
  const eventTarget = new s();
  const demultiplexedDataPublisher = getDataPublisherFromEventEmitter(eventTarget);
  return {
    ...demultiplexedDataPublisher,
    on(channelName, subscriber, options) {
      if (!innerPublisherState) {
        const innerPublisherUnsubscribe = publisher.on(sourceChannelName, (sourceMessage) => {
          const transformResult = messageTransformer(sourceMessage);
          if (!transformResult) {
            return;
          }
          const [destinationChannelName, message] = transformResult;
          eventTarget.dispatchEvent(
            new CustomEvent(destinationChannelName, {
              detail: message
            })
          );
        });
        innerPublisherState = {
          dispose: innerPublisherUnsubscribe,
          numSubscribers: 0
        };
      }
      innerPublisherState.numSubscribers++;
      const unsubscribe = demultiplexedDataPublisher.on(channelName, subscriber, options);
      let isActive = true;
      function handleUnsubscribe() {
        if (!isActive) {
          return;
        }
        isActive = false;
        options?.signal.removeEventListener("abort", handleUnsubscribe);
        innerPublisherState.numSubscribers--;
        if (innerPublisherState.numSubscribers === 0) {
          innerPublisherState.dispose();
          innerPublisherState = void 0;
        }
        unsubscribe();
      }
      options?.signal.addEventListener("abort", handleUnsubscribe);
      return handleUnsubscribe;
    }
  };
}
function createReactiveStoreFromDataPublisher({
  abortSignal,
  dataChannelName,
  dataPublisher,
  errorChannelName
}) {
  let currentState;
  let currentError;
  const subscribers = /* @__PURE__ */ new Set();
  const abortController = new e3();
  abortSignal.addEventListener("abort", () => abortController.abort(abortSignal.reason));
  dataPublisher.on(
    dataChannelName,
    (data) => {
      currentState = data;
      subscribers.forEach((cb) => cb());
    },
    { signal: abortController.signal }
  );
  dataPublisher.on(
    errorChannelName,
    (err) => {
      if (currentError !== void 0) return;
      currentError = err;
      abortController.abort(err);
      subscribers.forEach((cb) => cb());
    },
    { signal: abortController.signal }
  );
  return {
    getError() {
      return currentError;
    },
    getState() {
      return currentState;
    },
    subscribe(callback) {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    }
  };
}

// ../kit/packages/rpc-subscriptions-spec/dist/index.node.mjs
var import_events3 = require("events");
function createSubscriptionRpc(rpcConfig) {
  return new Proxy(rpcConfig.api, {
    defineProperty() {
      return false;
    },
    deleteProperty() {
      return false;
    },
    get(target, p, receiver) {
      if (p === "then") {
        return void 0;
      }
      return function(...rawParams) {
        const notificationName = p.toString();
        const createRpcSubscriptionPlan = Reflect.get(target, notificationName, receiver);
        if (!createRpcSubscriptionPlan) {
          throw new SolanaError(SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN, {
            notificationName
          });
        }
        const subscriptionPlan = createRpcSubscriptionPlan(...rawParams);
        return createPendingRpcSubscription(rpcConfig.transport, subscriptionPlan);
      };
    }
  });
}
function createPendingRpcSubscription(transport, subscriptionsPlan) {
  return {
    async reactive({ abortSignal }) {
      const notificationsDataPublisher = await transport({
        signal: abortSignal,
        ...subscriptionsPlan
      });
      return createReactiveStoreFromDataPublisher({
        abortSignal,
        dataChannelName: "notification",
        dataPublisher: notificationsDataPublisher,
        errorChannelName: "error"
      });
    },
    async subscribe({ abortSignal }) {
      const notificationsDataPublisher = await transport({
        signal: abortSignal,
        ...subscriptionsPlan
      });
      return createAsyncIterableFromDataPublisher({
        abortSignal,
        dataChannelName: "notification",
        dataPublisher: notificationsDataPublisher,
        errorChannelName: "error"
      });
    }
  };
}
function createRpcSubscriptionsApi(config) {
  return new Proxy({}, {
    defineProperty() {
      return false;
    },
    deleteProperty() {
      return false;
    },
    get(...args) {
      const [_, p] = args;
      const methodName = p.toString();
      return function(...params) {
        const rawRequest = { methodName, params };
        const request = config.requestTransformer ? config.requestTransformer(rawRequest) : rawRequest;
        return {
          execute(planConfig) {
            return config.planExecutor({ ...planConfig, request });
          },
          request
        };
      };
    }
  });
}
function transformChannelInboundMessages(channel, transform) {
  return Object.freeze({
    ...channel,
    on(type, subscriber, options) {
      if (type !== "message") {
        return channel.on(
          type,
          subscriber,
          options
        );
      }
      return channel.on(
        "message",
        (message) => subscriber(transform(message)),
        options
      );
    }
  });
}
function transformChannelOutboundMessages(channel, transform) {
  return Object.freeze({
    ...channel,
    send: (message) => channel.send(transform(message))
  });
}
var e4 = class extends globalThis.AbortController {
  constructor(...t) {
    super(...t), (0, import_events3.setMaxListeners)(Number.MAX_SAFE_INTEGER, this.signal);
  }
};
var subscriberCountBySubscriptionIdByChannel = /* @__PURE__ */ new WeakMap();
function decrementSubscriberCountAndReturnNewCount(channel, subscriptionId) {
  return augmentSubscriberCountAndReturnNewCount(-1, channel, subscriptionId);
}
function incrementSubscriberCount(channel, subscriptionId) {
  augmentSubscriberCountAndReturnNewCount(1, channel, subscriptionId);
}
function getSubscriberCountBySubscriptionIdForChannel(channel) {
  let subscriberCountBySubscriptionId = subscriberCountBySubscriptionIdByChannel.get(channel);
  if (!subscriberCountBySubscriptionId) {
    subscriberCountBySubscriptionIdByChannel.set(channel, subscriberCountBySubscriptionId = {});
  }
  return subscriberCountBySubscriptionId;
}
function augmentSubscriberCountAndReturnNewCount(amount, channel, subscriptionId) {
  if (subscriptionId === void 0) {
    return;
  }
  const subscriberCountBySubscriptionId = getSubscriberCountBySubscriptionIdForChannel(channel);
  if (!subscriberCountBySubscriptionId[subscriptionId] && amount > 0) {
    subscriberCountBySubscriptionId[subscriptionId] = 0;
  }
  const newCount = amount + subscriberCountBySubscriptionId[subscriptionId];
  if (newCount <= 0) {
    delete subscriberCountBySubscriptionId[subscriptionId];
  } else {
    subscriberCountBySubscriptionId[subscriptionId] = newCount;
  }
  return newCount;
}
var cache = /* @__PURE__ */ new WeakMap();
function getMemoizedDemultiplexedNotificationPublisherFromChannelAndResponseTransformer(channel, subscribeRequest, responseTransformer) {
  let publisherByResponseTransformer = cache.get(channel);
  if (!publisherByResponseTransformer) {
    cache.set(channel, publisherByResponseTransformer = /* @__PURE__ */ new WeakMap());
  }
  const responseTransformerKey = responseTransformer ?? channel;
  let publisher = publisherByResponseTransformer.get(responseTransformerKey);
  if (!publisher) {
    publisherByResponseTransformer.set(
      responseTransformerKey,
      publisher = demultiplexDataPublisher(channel, "message", (rawMessage) => {
        const message = rawMessage;
        if (!("method" in message)) {
          return;
        }
        const transformedNotification = responseTransformer ? responseTransformer(message.params.result, subscribeRequest) : message.params.result;
        return [`notification:${message.params.subscription}`, transformedNotification];
      })
    );
  }
  return publisher;
}
async function executeRpcPubSubSubscriptionPlan({
  channel,
  responseTransformer,
  signal,
  subscribeRequest,
  unsubscribeMethodName
}) {
  let subscriptionId;
  channel.on(
    "error",
    () => {
      subscriptionId = void 0;
      subscriberCountBySubscriptionIdByChannel.delete(channel);
    },
    { signal }
  );
  const abortPromise = new Promise((_, reject) => {
    function handleAbort() {
      if (decrementSubscriberCountAndReturnNewCount(channel, subscriptionId) === 0) {
        const unsubscribePayload = createRpcMessage({
          methodName: unsubscribeMethodName,
          params: [subscriptionId]
        });
        subscriptionId = void 0;
        channel.send(unsubscribePayload).catch(() => {
        });
      }
      reject(this.reason);
    }
    if (signal.aborted) {
      handleAbort.call(signal);
    } else {
      signal.addEventListener("abort", handleAbort);
    }
  });
  const subscribePayload = createRpcMessage(subscribeRequest);
  await channel.send(subscribePayload);
  const subscriptionIdPromise = new Promise((resolve, reject) => {
    const abortController = new e4();
    signal.addEventListener("abort", abortController.abort.bind(abortController));
    const options = { signal: abortController.signal };
    channel.on(
      "error",
      (err) => {
        abortController.abort();
        reject(err);
      },
      options
    );
    channel.on(
      "message",
      (message) => {
        if (message && typeof message === "object" && "id" in message && message.id === subscribePayload.id) {
          abortController.abort();
          if ("error" in message) {
            reject(getSolanaErrorFromJsonRpcError(message.error));
          } else {
            resolve(message.result);
          }
        }
      },
      options
    );
  });
  subscriptionId = await safeRace([abortPromise, subscriptionIdPromise]);
  if (subscriptionId == null) {
    throw new SolanaError(SOLANA_ERROR__RPC_SUBSCRIPTIONS__EXPECTED_SERVER_SUBSCRIPTION_ID);
  }
  incrementSubscriberCount(channel, subscriptionId);
  const notificationPublisher = getMemoizedDemultiplexedNotificationPublisherFromChannelAndResponseTransformer(
    channel,
    subscribeRequest,
    responseTransformer
  );
  const notificationKey = `notification:${subscriptionId}`;
  return {
    on(type, listener, options) {
      switch (type) {
        case "notification":
          return notificationPublisher.on(
            notificationKey,
            listener,
            options
          );
        case "error":
          return channel.on(
            "error",
            listener,
            options
          );
        default:
          throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__DATA_PUBLISHER_CHANNEL_UNIMPLEMENTED, {
            channelName: type,
            supportedChannelNames: ["notification", "error"]
          });
      }
    }
  };
}

// ../kit/packages/rpc-subscriptions-api/dist/index.node.mjs
function createSolanaRpcSubscriptionsApi_INTERNAL(config) {
  const requestTransformer = getDefaultRequestTransformerForSolanaRpc(config);
  const responseTransformer = getDefaultResponseTransformerForSolanaRpcSubscriptions({
    allowedNumericKeyPaths: getAllowedNumericKeypaths2()
  });
  return createRpcSubscriptionsApi({
    planExecutor({ request, ...rest }) {
      return executeRpcPubSubSubscriptionPlan({
        ...rest,
        responseTransformer,
        subscribeRequest: { ...request, methodName: request.methodName.replace(/Notifications$/, "Subscribe") },
        unsubscribeMethodName: request.methodName.replace(/Notifications$/, "Unsubscribe")
      });
    },
    requestTransformer
  });
}
function createSolanaRpcSubscriptionsApi(config) {
  return createSolanaRpcSubscriptionsApi_INTERNAL(config);
}
var memoizedKeypaths2;
function getAllowedNumericKeypaths2() {
  if (!memoizedKeypaths2) {
    memoizedKeypaths2 = {
      accountNotifications: jsonParsedAccountsConfigs.map((c) => ["value", ...c]),
      blockNotifications: [
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "preTokenBalances",
          KEYPATH_WILDCARD,
          "accountIndex"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "preTokenBalances",
          KEYPATH_WILDCARD,
          "uiTokenAmount",
          "decimals"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "postTokenBalances",
          KEYPATH_WILDCARD,
          "accountIndex"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "postTokenBalances",
          KEYPATH_WILDCARD,
          "uiTokenAmount",
          "decimals"
        ],
        ["value", "block", "transactions", KEYPATH_WILDCARD, "meta", "rewards", KEYPATH_WILDCARD, "commission"],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "innerInstructions",
          KEYPATH_WILDCARD,
          "index"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "innerInstructions",
          KEYPATH_WILDCARD,
          "instructions",
          KEYPATH_WILDCARD,
          "programIdIndex"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "meta",
          "innerInstructions",
          KEYPATH_WILDCARD,
          "instructions",
          KEYPATH_WILDCARD,
          "accounts",
          KEYPATH_WILDCARD
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "transaction",
          "message",
          "addressTableLookups",
          KEYPATH_WILDCARD,
          "writableIndexes",
          KEYPATH_WILDCARD
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "transaction",
          "message",
          "addressTableLookups",
          KEYPATH_WILDCARD,
          "readonlyIndexes",
          KEYPATH_WILDCARD
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "transaction",
          "message",
          "instructions",
          KEYPATH_WILDCARD,
          "programIdIndex"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "transaction",
          "message",
          "instructions",
          KEYPATH_WILDCARD,
          "accounts",
          KEYPATH_WILDCARD
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "transaction",
          "message",
          "header",
          "numReadonlySignedAccounts"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "transaction",
          "message",
          "header",
          "numReadonlyUnsignedAccounts"
        ],
        [
          "value",
          "block",
          "transactions",
          KEYPATH_WILDCARD,
          "transaction",
          "message",
          "header",
          "numRequiredSignatures"
        ],
        ["value", "block", "rewards", KEYPATH_WILDCARD, "commission"]
      ],
      programNotifications: jsonParsedAccountsConfigs.flatMap((c) => [
        ["value", KEYPATH_WILDCARD, "account", ...c],
        [KEYPATH_WILDCARD, "account", ...c]
      ])
    };
  }
  return memoizedKeypaths2;
}

// ../kit/packages/rpc-subscriptions/dist/index.node.mjs
var import_events5 = require("events");

// ../kit/packages/rpc-subscriptions-channel-websocket/dist/index.node.mjs
var import_events4 = require("events");

// ../kit/node_modules/.pnpm/ws@8.19.0_bufferutil@4.0.9_utf-8-validate@5.0.10/node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);
var wrapper_default = import_websocket.default;

// ../kit/packages/rpc-subscriptions-channel-websocket/dist/index.node.mjs
var s2 = class extends globalThis.EventTarget {
  constructor(...t) {
    super(...t), (0, import_events4.setMaxListeners)(Number.MAX_SAFE_INTEGER, this);
  }
};
var l = globalThis.WebSocket ? globalThis.WebSocket : wrapper_default;
var NORMAL_CLOSURE_CODE = 1e3;
function createWebSocketChannel({
  sendBufferHighWatermark,
  signal,
  url
}) {
  if (signal.aborted) {
    return Promise.reject(signal.reason);
  }
  let bufferDrainWatcher;
  let hasConnected = false;
  const listenerRemovers = /* @__PURE__ */ new Set();
  function cleanupListeners() {
    listenerRemovers.forEach((r) => {
      r();
    });
    listenerRemovers.clear();
  }
  function handleAbort() {
    cleanupListeners();
    if (!hasConnected) {
      rejectOpen(signal.reason);
    }
    if (webSocket.readyState !== l.CLOSED && webSocket.readyState !== l.CLOSING) {
      webSocket.close(NORMAL_CLOSURE_CODE);
    }
  }
  function handleClose(ev) {
    cleanupListeners();
    bufferDrainWatcher?.onCancel();
    signal.removeEventListener("abort", handleAbort);
    webSocket.removeEventListener("close", handleClose);
    webSocket.removeEventListener("error", handleError);
    webSocket.removeEventListener("message", handleMessage);
    webSocket.removeEventListener("open", handleOpen);
    if (!signal.aborted && !(ev.wasClean && ev.code === NORMAL_CLOSURE_CODE)) {
      eventTarget.dispatchEvent(
        new CustomEvent("error", {
          detail: new SolanaError(SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED, {
            cause: ev
          })
        })
      );
    }
  }
  function handleError(ev) {
    if (signal.aborted) {
      return;
    }
    if (!hasConnected) {
      const failedToConnectError = new SolanaError(SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT, {
        errorEvent: ev
      });
      rejectOpen(failedToConnectError);
      eventTarget.dispatchEvent(
        new CustomEvent("error", {
          detail: failedToConnectError
        })
      );
    }
  }
  function handleMessage(ev) {
    if (signal.aborted) {
      return;
    }
    eventTarget.dispatchEvent(new CustomEvent("message", { detail: ev.data }));
  }
  const eventTarget = new s2();
  const dataPublisher = getDataPublisherFromEventEmitter(eventTarget);
  function handleOpen() {
    hasConnected = true;
    resolveOpen({
      ...dataPublisher,
      async send(message) {
        if (webSocket.readyState !== l.OPEN) {
          throw new SolanaError(SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED);
        }
        if (!bufferDrainWatcher && webSocket.bufferedAmount > sendBufferHighWatermark) {
          let onCancel;
          const promise = new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
              if (webSocket.readyState !== l.OPEN || !(webSocket.bufferedAmount > sendBufferHighWatermark)) {
                clearInterval(intervalId);
                bufferDrainWatcher = void 0;
                resolve();
              }
            }, 16);
            onCancel = () => {
              bufferDrainWatcher = void 0;
              clearInterval(intervalId);
              reject(
                new SolanaError(
                  SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CLOSED_BEFORE_MESSAGE_BUFFERED
                )
              );
            };
          });
          bufferDrainWatcher = {
            onCancel,
            promise
          };
        }
        if (bufferDrainWatcher) {
          if (ArrayBuffer.isView(message) && !(message instanceof DataView)) {
            const TypedArrayConstructor = message.constructor;
            message = new TypedArrayConstructor(message);
          }
          await bufferDrainWatcher.promise;
        }
        webSocket.send(message);
      }
    });
  }
  const webSocket = new l(url);
  signal.addEventListener("abort", handleAbort);
  webSocket.addEventListener("close", handleClose);
  webSocket.addEventListener("error", handleError);
  webSocket.addEventListener("message", handleMessage);
  webSocket.addEventListener("open", handleOpen);
  let rejectOpen;
  let resolveOpen;
  return new Promise((resolve, reject) => {
    rejectOpen = reject;
    resolveOpen = resolve;
  });
}

// ../kit/packages/rpc-subscriptions/dist/index.node.mjs
function createSolanaJsonRpcIntegerOverflowError2(methodName, keyPath, value) {
  let argumentLabel = "";
  if (typeof keyPath[0] === "number") {
    const argPosition = keyPath[0] + 1;
    const lastDigit = argPosition % 10;
    const lastTwoDigits = argPosition % 100;
    if (lastDigit == 1 && lastTwoDigits != 11) {
      argumentLabel = argPosition + "st";
    } else if (lastDigit == 2 && lastTwoDigits != 12) {
      argumentLabel = argPosition + "nd";
    } else if (lastDigit == 3 && lastTwoDigits != 13) {
      argumentLabel = argPosition + "rd";
    } else {
      argumentLabel = argPosition + "th";
    }
  } else {
    argumentLabel = `\`${keyPath[0].toString()}\``;
  }
  const path = keyPath.length > 1 ? keyPath.slice(1).map((pathPart) => typeof pathPart === "number" ? `[${pathPart}]` : pathPart).join(".") : void 0;
  const error = new SolanaError(SOLANA_ERROR__RPC__INTEGER_OVERFLOW, {
    argumentLabel,
    keyPath,
    methodName,
    optionalPathLabel: path ? ` at path \`${path}\`` : "",
    value,
    ...path !== void 0 ? { path } : void 0
  });
  safeCaptureStackTrace(error, createSolanaJsonRpcIntegerOverflowError2);
  return error;
}
var DEFAULT_RPC_SUBSCRIPTIONS_CONFIG = {
  defaultCommitment: "confirmed",
  onIntegerOverflow(request, keyPath, value) {
    throw createSolanaJsonRpcIntegerOverflowError2(request.methodName, keyPath, value);
  }
};
var e5 = class extends globalThis.AbortController {
  constructor(...t) {
    super(...t), (0, import_events5.setMaxListeners)(Number.MAX_SAFE_INTEGER, this.signal);
  }
};
var PING_PAYLOAD = {
  jsonrpc: "2.0",
  method: "ping"
};
function getRpcSubscriptionsChannelWithAutoping({
  abortSignal: callerAbortSignal,
  channel,
  intervalMs
}) {
  let intervalId;
  function sendPing() {
    channel.send(PING_PAYLOAD).catch((e22) => {
      if (isSolanaError(e22, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED)) {
        pingerAbortController.abort();
      }
    });
  }
  function restartPingTimer() {
    clearInterval(intervalId);
    intervalId = setInterval(sendPing, intervalMs);
  }
  const pingerAbortController = new e5();
  pingerAbortController.signal.addEventListener("abort", () => {
    clearInterval(intervalId);
  });
  callerAbortSignal.addEventListener("abort", () => {
    pingerAbortController.abort();
  });
  channel.on(
    "error",
    () => {
      pingerAbortController.abort();
    },
    { signal: pingerAbortController.signal }
  );
  channel.on("message", restartPingTimer, { signal: pingerAbortController.signal });
  {
    restartPingTimer();
  }
  return {
    ...channel,
    send(...args) {
      if (!pingerAbortController.signal.aborted) {
        restartPingTimer();
      }
      return channel.send(...args);
    }
  };
}
function createChannelPool() {
  return {
    entries: [],
    freeChannelIndex: -1
  };
}
function getChannelPoolingChannelCreator(createChannel, { maxSubscriptionsPerChannel, minChannels }) {
  const pool = createChannelPool();
  function recomputeFreeChannelIndex() {
    if (pool.entries.length < minChannels) {
      pool.freeChannelIndex = -1;
      return;
    }
    let mostFreeChannel;
    for (let ii = 0; ii < pool.entries.length; ii++) {
      const nextPoolIndex = (pool.freeChannelIndex + ii + 2) % pool.entries.length;
      const nextPoolEntry = (
        // Start from the item two positions after the current item. This way, the
        // search will finish on the item after the current one. This ensures that, if
        // any channels tie for having the most capacity, the one that will be chosen is
        // the one immediately to the current one's right (wrapping around).
        pool.entries[nextPoolIndex]
      );
      if (nextPoolEntry.subscriptionCount < maxSubscriptionsPerChannel && (!mostFreeChannel || mostFreeChannel.subscriptionCount >= nextPoolEntry.subscriptionCount)) {
        mostFreeChannel = {
          poolIndex: nextPoolIndex,
          subscriptionCount: nextPoolEntry.subscriptionCount
        };
      }
    }
    pool.freeChannelIndex = mostFreeChannel?.poolIndex ?? -1;
  }
  return function getExistingChannelWithMostCapacityOrCreateChannel({ abortSignal }) {
    let poolEntry;
    function destroyPoolEntry() {
      const index = pool.entries.findIndex((entry) => entry === poolEntry);
      pool.entries.splice(index, 1);
      poolEntry.dispose();
      recomputeFreeChannelIndex();
    }
    if (pool.freeChannelIndex === -1) {
      const abortController = new e5();
      const newChannelPromise = createChannel({ abortSignal: abortController.signal });
      newChannelPromise.then((newChannel) => {
        newChannel.on("error", destroyPoolEntry, { signal: abortController.signal });
      }).catch(destroyPoolEntry);
      poolEntry = {
        channel: newChannelPromise,
        dispose() {
          abortController.abort();
        },
        subscriptionCount: 0
      };
      pool.entries.push(poolEntry);
    } else {
      poolEntry = pool.entries[pool.freeChannelIndex];
    }
    poolEntry.subscriptionCount++;
    abortSignal.addEventListener("abort", function destroyConsumer() {
      poolEntry.subscriptionCount--;
      if (poolEntry.subscriptionCount === 0) {
        destroyPoolEntry();
      } else if (pool.freeChannelIndex !== -1) {
        pool.freeChannelIndex--;
        recomputeFreeChannelIndex();
      }
    });
    recomputeFreeChannelIndex();
    return poolEntry.channel;
  };
}
function getRpcSubscriptionsChannelWithBigIntJSONSerialization(channel) {
  return pipe(
    channel,
    (c) => transformChannelInboundMessages(c, parseJsonWithBigInts),
    (c) => transformChannelOutboundMessages(c, stringifyJsonWithBigInts)
  );
}
function createDefaultSolanaRpcSubscriptionsChannelCreator(config) {
  return createDefaultRpcSubscriptionsChannelCreatorImpl({
    ...config,
    jsonSerializer: getRpcSubscriptionsChannelWithBigIntJSONSerialization
  });
}
function createDefaultRpcSubscriptionsChannelCreatorImpl(config) {
  if (/^wss?:/i.test(config.url) === false) {
    const protocolMatch = config.url.match(/^([^:]+):/);
    throw new DOMException(
      protocolMatch ? `Failed to construct 'WebSocket': The URL's scheme must be either 'ws' or 'wss'. '${protocolMatch[1]}:' is not allowed.` : `Failed to construct 'WebSocket': The URL '${config.url}' is invalid.`
    );
  }
  const { intervalMs, ...rest } = config;
  const createDefaultRpcSubscriptionsChannel = (({ abortSignal }) => {
    return createWebSocketChannel({
      ...rest,
      sendBufferHighWatermark: config.sendBufferHighWatermark ?? // Let 128KB of data into the WebSocket buffer before buffering it in the app.
      131072,
      signal: abortSignal
    }).then(config.jsonSerializer).then(
      (channel) => getRpcSubscriptionsChannelWithAutoping({
        abortSignal,
        channel,
        intervalMs: intervalMs ?? 5e3
      })
    );
  });
  return getChannelPoolingChannelCreator(createDefaultRpcSubscriptionsChannel, {
    maxSubscriptionsPerChannel: config.maxSubscriptionsPerChannel ?? /**
    * A note about this default. The idea here is that, because some RPC providers impose
    * an upper limit on the number of subscriptions you can make per channel, we must
    * choose a number low enough to avoid hitting that limit. Without knowing what provider
    * a given person is using, or what their limit is, we have to choose the lowest of all
    * known limits. As of this writing (October 2024) that is the public mainnet RPC node
    * (api.mainnet-beta.solana.com) at 100 subscriptions.
    */
    100,
    minChannels: config.minChannels ?? 1
  });
}
function getRpcSubscriptionsTransportWithSubscriptionCoalescing(transport) {
  const cache2 = /* @__PURE__ */ new Map();
  return function rpcSubscriptionsTransportWithSubscriptionCoalescing(config) {
    const { request, signal } = config;
    const subscriptionConfigurationHash = index_default([request.methodName, request.params]);
    let cachedDataPublisherPromise = cache2.get(subscriptionConfigurationHash);
    if (!cachedDataPublisherPromise) {
      const abortController = new e5();
      const dataPublisherPromise = transport({
        ...config,
        signal: abortController.signal
      });
      dataPublisherPromise.then((dataPublisher) => {
        dataPublisher.on(
          "error",
          () => {
            cache2.delete(subscriptionConfigurationHash);
            abortController.abort();
          },
          { signal: abortController.signal }
        );
      }).catch(() => {
      });
      cache2.set(
        subscriptionConfigurationHash,
        cachedDataPublisherPromise = {
          abortController,
          dataPublisherPromise,
          numSubscribers: 0
        }
      );
    }
    cachedDataPublisherPromise.numSubscribers++;
    signal.addEventListener(
      "abort",
      () => {
        cachedDataPublisherPromise.numSubscribers--;
        if (cachedDataPublisherPromise.numSubscribers === 0) {
          queueMicrotask(() => {
            if (cachedDataPublisherPromise.numSubscribers === 0) {
              cache2.delete(subscriptionConfigurationHash);
              cachedDataPublisherPromise.abortController.abort();
            }
          });
        }
      },
      { signal: cachedDataPublisherPromise.abortController.signal }
    );
    return cachedDataPublisherPromise.dataPublisherPromise;
  };
}
function createDefaultRpcSubscriptionsTransport({
  createChannel
}) {
  return pipe(
    createRpcSubscriptionsTransportFromChannelCreator(
      createChannel
    ),
    (transport) => getRpcSubscriptionsTransportWithSubscriptionCoalescing(transport)
  );
}
function createRpcSubscriptionsTransportFromChannelCreator(createChannel) {
  return (async ({ execute, signal }) => {
    const channel = await createChannel({ abortSignal: signal });
    return await execute({ channel, signal });
  });
}
function createSolanaRpcSubscriptionsImpl(clusterUrl, config) {
  const transport = createDefaultRpcSubscriptionsTransport({
    createChannel: createDefaultSolanaRpcSubscriptionsChannelCreator({ ...config, url: clusterUrl })
  });
  return createSolanaRpcSubscriptionsFromTransport(transport);
}
function createSolanaRpcSubscriptions(clusterUrl, config) {
  return createSolanaRpcSubscriptionsImpl(clusterUrl, config);
}
function createSolanaRpcSubscriptionsFromTransport(transport) {
  return createSubscriptionRpc({
    api: createSolanaRpcSubscriptionsApi(DEFAULT_RPC_SUBSCRIPTIONS_CONFIG),
    transport
  });
}

// ../kit/packages/signers/dist/index.node.mjs
function deduplicateSigners(signers) {
  const deduplicated = {};
  signers.forEach((signer) => {
    if (!deduplicated[signer.address]) {
      deduplicated[signer.address] = signer;
    } else if (!signersAreEquivalent(deduplicated[signer.address], signer)) {
      throw new SolanaError(SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, {
        address: signer.address
      });
    }
  });
  return Object.values(deduplicated);
}
function signersAreEquivalent(a, b) {
  if (a === b) return true;
  const aKeys = Object.getOwnPropertyNames(a);
  const bKeys = Object.getOwnPropertyNames(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => {
    if (!(key in b)) return false;
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === "function" && typeof bVal === "function") {
      return aVal.toString() === bVal.toString();
    }
    return aVal === bVal;
  });
}
function isTransactionModifyingSigner(value) {
  return "modifyAndSignTransactions" in value && typeof value.modifyAndSignTransactions === "function";
}
function isTransactionPartialSigner(value) {
  return "signTransactions" in value && typeof value.signTransactions === "function";
}
function isTransactionSendingSigner(value) {
  return "signAndSendTransactions" in value && typeof value.signAndSendTransactions === "function";
}
function isTransactionSigner(value) {
  return isTransactionPartialSigner(value) || isTransactionModifyingSigner(value) || isTransactionSendingSigner(value);
}
function getSignersFromInstruction(instruction) {
  return deduplicateSigners(
    (instruction.accounts ?? []).flatMap((account) => "signer" in account ? account.signer : [])
  );
}
function getSignersFromTransactionMessage(transaction) {
  return deduplicateSigners([
    ...transaction.feePayer && isTransactionSigner(transaction.feePayer) ? [transaction.feePayer] : [],
    ...transaction.instructions.flatMap(getSignersFromInstruction)
  ]);
}
async function createSignerFromKeyPair(keyPair) {
  const address2 = await getAddressFromPublicKey(keyPair.publicKey);
  const out = {
    address: address2,
    keyPair,
    signMessages: (messages) => Promise.all(
      messages.map(
        async (message) => Object.freeze({ [address2]: await signBytes(keyPair.privateKey, message.content) })
      )
    ),
    signTransactions: (transactions) => Promise.all(
      transactions.map(async (transaction) => {
        const signedTransaction = await partiallySignTransaction([keyPair], transaction);
        return Object.freeze({ [address2]: signedTransaction.signatures[address2] });
      })
    )
  };
  return Object.freeze(out);
}
async function generateKeyPairSigner(extractable = false) {
  return await createSignerFromKeyPair(await generateKeyPair(extractable));
}
async function partiallySignTransactionMessageWithSigners(transactionMessage, config) {
  return await partiallySignTransactionWithSigners(
    getSignersFromTransactionMessage(transactionMessage).filter(
      (signer) => isTransactionModifyingSigner(signer) || isTransactionPartialSigner(signer)
    ),
    compileTransaction(transactionMessage),
    config
  );
}
async function signTransactionMessageWithSigners(transactionMessage, config) {
  const signedTransaction = await partiallySignTransactionMessageWithSigners(transactionMessage, config);
  assertIsFullySignedTransaction(signedTransaction);
  return signedTransaction;
}
async function partiallySignTransactionWithSigners(signers, transaction, config) {
  const { partialSigners, modifyingSigners } = categorizeTransactionSigners(deduplicateSigners(signers), {
    identifySendingSigner: false
  });
  return await signModifyingAndPartialTransactionSigners(transaction, modifyingSigners, partialSigners, config);
}
function categorizeTransactionSigners(signers, config = {}) {
  const identifySendingSigner = config.identifySendingSigner ?? true;
  const sendingSigner = identifySendingSigner ? identifyTransactionSendingSigner(signers) : null;
  const otherSigners = signers.filter(
    (signer) => signer !== sendingSigner && (isTransactionModifyingSigner(signer) || isTransactionPartialSigner(signer))
  );
  const modifyingSigners = identifyTransactionModifyingSigners(otherSigners);
  const partialSigners = otherSigners.filter(isTransactionPartialSigner).filter((signer) => !modifyingSigners.includes(signer));
  return Object.freeze({ modifyingSigners, partialSigners, sendingSigner });
}
function identifyTransactionSendingSigner(signers) {
  const sendingSigners = signers.filter(isTransactionSendingSigner);
  if (sendingSigners.length === 0) return null;
  const sendingOnlySigners = sendingSigners.filter(
    (signer) => !isTransactionModifyingSigner(signer) && !isTransactionPartialSigner(signer)
  );
  if (sendingOnlySigners.length > 0) {
    return sendingOnlySigners[0];
  }
  return sendingSigners[0];
}
function identifyTransactionModifyingSigners(signers) {
  const modifyingSigners = signers.filter(isTransactionModifyingSigner);
  if (modifyingSigners.length === 0) return [];
  const nonPartialSigners = modifyingSigners.filter((signer) => !isTransactionPartialSigner(signer));
  if (nonPartialSigners.length > 0) return nonPartialSigners;
  return [modifyingSigners[0]];
}
async function signModifyingAndPartialTransactionSigners(transaction, modifyingSigners = [], partialSigners = [], config) {
  const modifiedTransaction = await modifyingSigners.reduce(
    async (transaction2, modifyingSigner) => {
      config?.abortSignal?.throwIfAborted();
      const [tx] = await modifyingSigner.modifyAndSignTransactions([await transaction2], config);
      return Object.freeze(tx);
    },
    Promise.resolve(transaction)
  );
  config?.abortSignal?.throwIfAborted();
  const signatureDictionaries = await Promise.all(
    partialSigners.map(async (partialSigner) => {
      const [signatures] = await partialSigner.signTransactions([modifiedTransaction], config);
      return signatures;
    })
  );
  return Object.freeze({
    ...modifiedTransaction,
    signatures: Object.freeze(
      signatureDictionaries.reduce((signatures, signatureDictionary) => {
        return { ...signatures, ...signatureDictionary };
      }, modifiedTransaction.signatures ?? {})
    )
  });
}
var o2 = globalThis.TextEncoder;

// ../kit/packages/transaction-confirmation/dist/index.node.mjs
var import_events6 = require("events");
var e6 = class extends globalThis.AbortController {
  constructor(...t) {
    super(...t), (0, import_events6.setMaxListeners)(Number.MAX_SAFE_INTEGER, this.signal);
  }
};
function createBlockHeightExceedencePromiseFactory({
  rpc,
  rpcSubscriptions
}) {
  return async function getBlockHeightExceedencePromise({
    abortSignal: callerAbortSignal,
    commitment,
    lastValidBlockHeight
  }) {
    callerAbortSignal.throwIfAborted();
    const abortController = new e6();
    const handleAbort = () => {
      abortController.abort();
    };
    callerAbortSignal.addEventListener("abort", handleAbort, { signal: abortController.signal });
    async function getBlockHeightAndDifferenceBetweenSlotHeightAndBlockHeight() {
      const { absoluteSlot, blockHeight } = await rpc.getEpochInfo({ commitment }).send({ abortSignal: abortController.signal });
      return {
        blockHeight,
        differenceBetweenSlotHeightAndBlockHeight: absoluteSlot - blockHeight
      };
    }
    try {
      const [slotNotifications, { blockHeight: initialBlockHeight, differenceBetweenSlotHeightAndBlockHeight }] = await Promise.all([
        rpcSubscriptions.slotNotifications().subscribe({ abortSignal: abortController.signal }),
        getBlockHeightAndDifferenceBetweenSlotHeightAndBlockHeight()
      ]);
      callerAbortSignal.throwIfAborted();
      let currentBlockHeight = initialBlockHeight;
      if (currentBlockHeight <= lastValidBlockHeight) {
        let lastKnownDifferenceBetweenSlotHeightAndBlockHeight = differenceBetweenSlotHeightAndBlockHeight;
        for await (const slotNotification of slotNotifications) {
          const { slot } = slotNotification;
          if (slot - lastKnownDifferenceBetweenSlotHeightAndBlockHeight > lastValidBlockHeight) {
            const {
              blockHeight: recheckedBlockHeight,
              differenceBetweenSlotHeightAndBlockHeight: currentDifferenceBetweenSlotHeightAndBlockHeight
            } = await getBlockHeightAndDifferenceBetweenSlotHeightAndBlockHeight();
            currentBlockHeight = recheckedBlockHeight;
            if (currentBlockHeight > lastValidBlockHeight) {
              break;
            } else {
              lastKnownDifferenceBetweenSlotHeightAndBlockHeight = currentDifferenceBetweenSlotHeightAndBlockHeight;
            }
          }
        }
      }
      callerAbortSignal.throwIfAborted();
      throw new SolanaError(SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, {
        currentBlockHeight,
        lastValidBlockHeight
      });
    } finally {
      abortController.abort();
    }
  };
}
var NONCE_VALUE_OFFSET = 4 + // version(u32)
4 + // state(u32)
32;
function createRecentSignatureConfirmationPromiseFactory({
  rpc,
  rpcSubscriptions
}) {
  return async function getRecentSignatureConfirmationPromise({
    abortSignal: callerAbortSignal,
    commitment,
    signature
  }) {
    const abortController = new e6();
    function handleAbort() {
      abortController.abort();
    }
    callerAbortSignal.addEventListener("abort", handleAbort, { signal: abortController.signal });
    const signatureStatusNotifications = await rpcSubscriptions.signatureNotifications(signature, { commitment }).subscribe({ abortSignal: abortController.signal });
    const signatureDidCommitPromise = (async () => {
      for await (const signatureStatusNotification of signatureStatusNotifications) {
        if (signatureStatusNotification.value.err) {
          throw getSolanaErrorFromTransactionError(signatureStatusNotification.value.err);
        } else {
          return;
        }
      }
    })();
    const signatureStatusLookupPromise = (async () => {
      const { value: signatureStatusResults } = await rpc.getSignatureStatuses([signature]).send({ abortSignal: abortController.signal });
      const signatureStatus = signatureStatusResults[0];
      if (signatureStatus?.err) {
        throw getSolanaErrorFromTransactionError(signatureStatus.err);
      } else if (signatureStatus?.confirmationStatus && commitmentComparator(signatureStatus.confirmationStatus, commitment) >= 0) {
        return;
      } else {
        await new Promise(() => {
        });
      }
    })();
    try {
      return await safeRace([signatureDidCommitPromise, signatureStatusLookupPromise]);
    } finally {
      abortController.abort();
    }
  };
}
async function raceStrategies(signature, config, getSpecificStrategiesForRace) {
  const { abortSignal: callerAbortSignal, commitment, getRecentSignatureConfirmationPromise } = config;
  callerAbortSignal?.throwIfAborted();
  const abortController = new e6();
  if (callerAbortSignal) {
    const handleAbort = () => {
      abortController.abort();
    };
    callerAbortSignal.addEventListener("abort", handleAbort, { signal: abortController.signal });
  }
  try {
    const specificStrategies = getSpecificStrategiesForRace({
      ...config,
      abortSignal: abortController.signal
    });
    return await safeRace([
      getRecentSignatureConfirmationPromise({
        abortSignal: abortController.signal,
        commitment,
        signature
      }),
      ...specificStrategies
    ]);
  } finally {
    abortController.abort();
  }
}
async function waitForRecentTransactionConfirmation(config) {
  await raceStrategies(
    getSignatureFromTransaction(config.transaction),
    config,
    function getSpecificStrategiesForRace({
      abortSignal,
      commitment,
      getBlockHeightExceedencePromise,
      transaction
    }) {
      return [
        getBlockHeightExceedencePromise({
          abortSignal,
          commitment,
          lastValidBlockHeight: transaction.lifetimeConstraint.lastValidBlockHeight
        })
      ];
    }
  );
}

// ../kit/packages/kit/src/send-transaction-internal.ts
function getSendTransactionConfigWithAdjustedPreflightCommitment(commitment, config) {
  if (
    // The developer has supplied no value for `preflightCommitment`.
    !config?.preflightCommitment && // The value of `commitment` is lower than the server default of `preflightCommitment`.
    commitmentComparator(
      commitment,
      "finalized"
      /* default value of `preflightCommitment` */
    ) < 0
  ) {
    return {
      ...config,
      // In the common case, it is unlikely that you want to simulate a transaction at
      // `finalized` commitment when your standard of commitment for confirming the
      // transaction is lower. Cap the simulation commitment level to the level of the
      // confirmation commitment.
      preflightCommitment: commitment
    };
  }
  return config;
}
async function sendTransaction_INTERNAL_ONLY_DO_NOT_EXPORT({
  abortSignal,
  commitment,
  rpc,
  transaction,
  ...sendTransactionConfig
}) {
  const base64EncodedWireTransaction = getBase64EncodedWireTransaction(transaction);
  return await rpc.sendTransaction(base64EncodedWireTransaction, {
    ...getSendTransactionConfigWithAdjustedPreflightCommitment(commitment, sendTransactionConfig),
    encoding: "base64"
  }).send({ abortSignal });
}
async function sendAndConfirmTransactionWithBlockhashLifetime_INTERNAL_ONLY_DO_NOT_EXPORT({
  abortSignal,
  commitment,
  confirmRecentTransaction,
  rpc,
  transaction,
  ...sendTransactionConfig
}) {
  const transactionSignature = await sendTransaction_INTERNAL_ONLY_DO_NOT_EXPORT({
    ...sendTransactionConfig,
    abortSignal,
    commitment,
    rpc,
    transaction
  });
  await confirmRecentTransaction({
    abortSignal,
    commitment,
    transaction
  });
  return transactionSignature;
}

// ../kit/packages/kit/src/send-and-confirm-transaction.ts
function sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions
}) {
  const getBlockHeightExceedencePromise = createBlockHeightExceedencePromiseFactory({
    rpc,
    rpcSubscriptions
  });
  const getRecentSignatureConfirmationPromise = createRecentSignatureConfirmationPromiseFactory({
    rpc,
    rpcSubscriptions
  });
  async function confirmRecentTransaction(config) {
    await waitForRecentTransactionConfirmation({
      ...config,
      getBlockHeightExceedencePromise,
      getRecentSignatureConfirmationPromise
    });
  }
  return async function sendAndConfirmTransaction(transaction, config) {
    await sendAndConfirmTransactionWithBlockhashLifetime_INTERNAL_ONLY_DO_NOT_EXPORT({
      ...config,
      confirmRecentTransaction,
      rpc,
      transaction
    });
  };
}

// ../kit/packages/transaction-messages/src/v1-transaction-config.ts
function isV1ConfigEmpty(config) {
  return config.computeUnitLimit === void 0 && config.heapSize === void 0 && config.loadedAccountsDataSizeLimit === void 0 && config.priorityFeeLamports === void 0;
}
function areV1ConfigsEqual(config1, config2) {
  return config1.computeUnitLimit === config2.computeUnitLimit && config1.heapSize === config2.heapSize && config1.loadedAccountsDataSizeLimit === config2.loadedAccountsDataSizeLimit && config1.priorityFeeLamports === config2.priorityFeeLamports;
}
function setTransactionMessageConfig(config, transactionMessage) {
  const mergedConfig = {
    ...transactionMessage.config,
    ...config
  };
  if (isV1ConfigEmpty(mergedConfig)) {
    if (!transactionMessage.config) {
      return transactionMessage;
    }
    const { config: config2, ...rest } = transactionMessage;
    return Object.freeze(rest);
  }
  if (transactionMessage.config && areV1ConfigsEqual(transactionMessage.config, mergedConfig)) {
    return transactionMessage;
  }
  return Object.freeze({
    ...transactionMessage,
    config: Object.freeze(mergedConfig)
  });
}

// node_modules/.pnpm/@solana+errors@6.8.0_typescript@6.0.3/node_modules/@solana/errors/dist/index.node.mjs
var SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED2 = 1;
var SOLANA_ERROR__INVALID_NONCE2 = 2;
var SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND2 = 3;
var SOLANA_ERROR__BLOCKHASH_STRING_LENGTH_OUT_OF_RANGE2 = 4;
var SOLANA_ERROR__INVALID_BLOCKHASH_BYTE_LENGTH2 = 5;
var SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE2 = 6;
var SOLANA_ERROR__MALFORMED_BIGINT_STRING2 = 7;
var SOLANA_ERROR__MALFORMED_NUMBER_STRING2 = 8;
var SOLANA_ERROR__TIMESTAMP_OUT_OF_RANGE2 = 9;
var SOLANA_ERROR__MALFORMED_JSON_RPC_ERROR2 = 10;
var SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION2 = 11;
var SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS2 = 12;
var SOLANA_ERROR__JSON_RPC__PARSE_ERROR2 = -32700;
var SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR2 = -32603;
var SOLANA_ERROR__JSON_RPC__INVALID_PARAMS2 = -32602;
var SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND2 = -32601;
var SOLANA_ERROR__JSON_RPC__INVALID_REQUEST2 = -32600;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_UNREACHABLE2 = -32019;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_NOT_EPOCH_BOUNDARY2 = -32018;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_EPOCH_REWARDS_PERIOD_ACTIVE2 = -32017;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED2 = -32016;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION2 = -32015;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET2 = -32014;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_LEN_MISMATCH2 = -32013;
var SOLANA_ERROR__JSON_RPC__SCAN_ERROR2 = -32012;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE2 = -32011;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX2 = -32010;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED2 = -32009;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT2 = -32008;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED2 = -32007;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_PRECOMPILE_VERIFICATION_FAILURE2 = -32006;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY2 = -32005;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE2 = -32004;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_VERIFICATION_FAILURE2 = -32003;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE2 = -32002;
var SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP2 = -32001;
var SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH2 = 28e5;
var SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE2 = 2800001;
var SOLANA_ERROR__ADDRESSES__INVALID_BASE58_ENCODED_ADDRESS2 = 2800002;
var SOLANA_ERROR__ADDRESSES__INVALID_ED25519_PUBLIC_KEY2 = 2800003;
var SOLANA_ERROR__ADDRESSES__MALFORMED_PDA2 = 2800004;
var SOLANA_ERROR__ADDRESSES__PDA_BUMP_SEED_OUT_OF_RANGE2 = 2800005;
var SOLANA_ERROR__ADDRESSES__MAX_NUMBER_OF_PDA_SEEDS_EXCEEDED2 = 2800006;
var SOLANA_ERROR__ADDRESSES__MAX_PDA_SEED_LENGTH_EXCEEDED2 = 2800007;
var SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE2 = 2800008;
var SOLANA_ERROR__ADDRESSES__FAILED_TO_FIND_VIABLE_PDA_BUMP_SEED2 = 2800009;
var SOLANA_ERROR__ADDRESSES__PDA_ENDS_WITH_PDA_MARKER2 = 2800010;
var SOLANA_ERROR__ADDRESSES__INVALID_OFF_CURVE_ADDRESS2 = 2800011;
var SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND2 = 323e4;
var SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND2 = 32300001;
var SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT2 = 3230002;
var SOLANA_ERROR__ACCOUNTS__EXPECTED_DECODED_ACCOUNT2 = 3230003;
var SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED2 = 3230004;
var SOLANA_ERROR__SUBTLE_CRYPTO__DISALLOWED_IN_INSECURE_CONTEXT2 = 361e4;
var SOLANA_ERROR__SUBTLE_CRYPTO__DIGEST_UNIMPLEMENTED2 = 3610001;
var SOLANA_ERROR__SUBTLE_CRYPTO__ED25519_ALGORITHM_UNIMPLEMENTED2 = 3610002;
var SOLANA_ERROR__SUBTLE_CRYPTO__EXPORT_FUNCTION_UNIMPLEMENTED2 = 3610003;
var SOLANA_ERROR__SUBTLE_CRYPTO__GENERATE_FUNCTION_UNIMPLEMENTED2 = 3610004;
var SOLANA_ERROR__SUBTLE_CRYPTO__SIGN_FUNCTION_UNIMPLEMENTED2 = 3610005;
var SOLANA_ERROR__SUBTLE_CRYPTO__VERIFY_FUNCTION_UNIMPLEMENTED2 = 3610006;
var SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY2 = 3610007;
var SOLANA_ERROR__CRYPTO__RANDOM_VALUES_FUNCTION_UNIMPLEMENTED2 = 3611e3;
var SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH2 = 3704e3;
var SOLANA_ERROR__KEYS__INVALID_PRIVATE_KEY_BYTE_LENGTH2 = 3704001;
var SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH2 = 3704002;
var SOLANA_ERROR__KEYS__SIGNATURE_STRING_LENGTH_OUT_OF_RANGE2 = 3704003;
var SOLANA_ERROR__KEYS__PUBLIC_KEY_MUST_MATCH_PRIVATE_KEY2 = 3704004;
var SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX2 = 3704005;
var SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT2 = 3704006;
var SOLANA_ERROR__FS__UNSUPPORTED_ENVIRONMENT2 = 3712e3;
var SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_ACCOUNTS2 = 4128e3;
var SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_DATA2 = 4128001;
var SOLANA_ERROR__INSTRUCTION__PROGRAM_ID_MISMATCH2 = 4128002;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN2 = 4615e3;
var SOLANA_ERROR__INSTRUCTION_ERROR__GENERIC_ERROR2 = 4615001;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT2 = 4615002;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_INSTRUCTION_DATA2 = 4615003;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_DATA2 = 4615004;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_TOO_SMALL2 = 4615005;
var SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS2 = 4615006;
var SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_PROGRAM_ID2 = 4615007;
var SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_REQUIRED_SIGNATURE2 = 4615008;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_ALREADY_INITIALIZED2 = 4615009;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNINITIALIZED_ACCOUNT2 = 4615010;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNBALANCED_INSTRUCTION2 = 4615011;
var SOLANA_ERROR__INSTRUCTION_ERROR__MODIFIED_PROGRAM_ID2 = 4615012;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_LAMPORT_SPEND2 = 4615013;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_DATA_MODIFIED2 = 4615014;
var SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_LAMPORT_CHANGE2 = 4615015;
var SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_DATA_MODIFIED2 = 4615016;
var SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_INDEX2 = 4615017;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_MODIFIED2 = 4615018;
var SOLANA_ERROR__INSTRUCTION_ERROR__RENT_EPOCH_MODIFIED2 = 4615019;
var SOLANA_ERROR__INSTRUCTION_ERROR__NOT_ENOUGH_ACCOUNT_KEYS2 = 4615020;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_SIZE_CHANGED2 = 4615021;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_EXECUTABLE2 = 4615022;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_FAILED2 = 4615023;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_OUTSTANDING2 = 4615024;
var SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_OUT_OF_SYNC2 = 4615025;
var SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM2 = 4615026;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ERROR2 = 4615027;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_DATA_MODIFIED2 = 4615028;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_LAMPORT_CHANGE2 = 4615029;
var SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_ACCOUNT_NOT_RENT_EXEMPT2 = 4615030;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_PROGRAM_ID2 = 4615031;
var SOLANA_ERROR__INSTRUCTION_ERROR__CALL_DEPTH2 = 4615032;
var SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_ACCOUNT2 = 4615033;
var SOLANA_ERROR__INSTRUCTION_ERROR__REENTRANCY_NOT_ALLOWED2 = 4615034;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_SEED_LENGTH_EXCEEDED2 = 4615035;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_SEEDS2 = 4615036;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_REALLOC2 = 4615037;
var SOLANA_ERROR__INSTRUCTION_ERROR__COMPUTATIONAL_BUDGET_EXCEEDED2 = 4615038;
var SOLANA_ERROR__INSTRUCTION_ERROR__PRIVILEGE_ESCALATION2 = 4615039;
var SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_ENVIRONMENT_SETUP_FAILURE2 = 4615040;
var SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPLETE2 = 4615041;
var SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPILE2 = 4615042;
var SOLANA_ERROR__INSTRUCTION_ERROR__IMMUTABLE2 = 4615043;
var SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_AUTHORITY2 = 4615044;
var SOLANA_ERROR__INSTRUCTION_ERROR__BORSH_IO_ERROR2 = 4615045;
var SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_RENT_EXEMPT2 = 4615046;
var SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_OWNER2 = 4615047;
var SOLANA_ERROR__INSTRUCTION_ERROR__ARITHMETIC_OVERFLOW2 = 4615048;
var SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_SYSVAR2 = 4615049;
var SOLANA_ERROR__INSTRUCTION_ERROR__ILLEGAL_OWNER2 = 4615050;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_DATA_ALLOCATIONS_EXCEEDED2 = 4615051;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_EXCEEDED2 = 4615052;
var SOLANA_ERROR__INSTRUCTION_ERROR__MAX_INSTRUCTION_TRACE_LENGTH_EXCEEDED2 = 4615053;
var SOLANA_ERROR__INSTRUCTION_ERROR__BUILTIN_PROGRAMS_MUST_CONSUME_COMPUTE_UNITS2 = 4615054;
var SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS2 = 5508e3;
var SOLANA_ERROR__SIGNER__EXPECTED_KEY_PAIR_SIGNER2 = 5508001;
var SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_SIGNER2 = 5508002;
var SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_MODIFYING_SIGNER2 = 5508003;
var SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_PARTIAL_SIGNER2 = 5508004;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SIGNER2 = 5508005;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_MODIFYING_SIGNER2 = 5508006;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_PARTIAL_SIGNER2 = 5508007;
var SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SENDING_SIGNER2 = 5508008;
var SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS2 = 5508009;
var SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING2 = 5508010;
var SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED2 = 5508011;
var SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION2 = 5508012;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED2 = 5607e3;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE2 = 5607001;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__APPLICATION_DOMAIN_STRING_LENGTH_OUT_OF_RANGE2 = 5607002;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__INVALID_APPLICATION_DOMAIN_BYTE_LENGTH2 = 5607003;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH2 = 5607004;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO2 = 5607005;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED2 = 5607006;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH2 = 5607007;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH2 = 5607008;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY2 = 5607009;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO2 = 5607010;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING2 = 5607011;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH2 = 5607012;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE2 = 5607013;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION2 = 5607014;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_SORTED2 = 5607015;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE2 = 5607016;
var SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE2 = 5607017;
var SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_CANNOT_PAY_FEES2 = 5663e3;
var SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE2 = 5663001;
var SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME2 = 5663002;
var SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME2 = 5663003;
var SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_OUT_OF_RANGE2 = 5663004;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING2 = 5663005;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE2 = 5663006;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND2 = 5663007;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING2 = 5663008;
var SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING2 = 5663009;
var SOLANA_ERROR__TRANSACTION__ADDRESS_MISSING2 = 5663010;
var SOLANA_ERROR__TRANSACTION__FEE_PAYER_MISSING2 = 5663011;
var SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING2 = 5663012;
var SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_INSTRUCTIONS_MISSING2 = 5663013;
var SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_FIRST_INSTRUCTION_MUST_BE_ADVANCE_NONCE2 = 5663014;
var SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION2 = 5663015;
var SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES2 = 5663016;
var SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH2 = 5663017;
var SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT2 = 5663018;
var SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT2 = 5663019;
var SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT2 = 5663020;
var SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED2 = 5663021;
var SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE2 = 5663022;
var SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES2 = 5663023;
var SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_MESSAGE_BYTES2 = 5663024;
var SOLANA_ERROR__TRANSACTION__CANNOT_DECODE_EMPTY_TRANSACTION_BYTES2 = 5663025;
var SOLANA_ERROR__TRANSACTION__VERSION_ZERO_MUST_BE_ENCODED_WITH_SIGNATURES_FIRST2 = 5663026;
var SOLANA_ERROR__TRANSACTION__SIGNATURE_COUNT_TOO_HIGH_FOR_TRANSACTION_BYTES2 = 5663027;
var SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS2 = 5663028;
var SOLANA_ERROR__TRANSACTION__INVALID_NONCE_ACCOUNT_INDEX2 = 5663029;
var SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND2 = 5663030;
var SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH2 = 5663031;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES2 = 5663032;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES2 = 5663033;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS2 = 5663034;
var SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION2 = 5663035;
var SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN2 = 705e4;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_IN_USE2 = 7050001;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_LOADED_TWICE2 = 7050002;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_NOT_FOUND2 = 7050003;
var SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_ACCOUNT_NOT_FOUND2 = 7050004;
var SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE2 = 7050005;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_FOR_FEE2 = 7050006;
var SOLANA_ERROR__TRANSACTION_ERROR__ALREADY_PROCESSED2 = 7050007;
var SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND2 = 7050008;
var SOLANA_ERROR__TRANSACTION_ERROR__CALL_CHAIN_TOO_DEEP2 = 7050009;
var SOLANA_ERROR__TRANSACTION_ERROR__MISSING_SIGNATURE_FOR_FEE2 = 7050010;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_INDEX2 = 7050011;
var SOLANA_ERROR__TRANSACTION_ERROR__SIGNATURE_FAILURE2 = 7050012;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_PROGRAM_FOR_EXECUTION2 = 7050013;
var SOLANA_ERROR__TRANSACTION_ERROR__SANITIZE_FAILURE2 = 7050014;
var SOLANA_ERROR__TRANSACTION_ERROR__CLUSTER_MAINTENANCE2 = 7050015;
var SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_BORROW_OUTSTANDING2 = 7050016;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_BLOCK_COST_LIMIT2 = 7050017;
var SOLANA_ERROR__TRANSACTION_ERROR__UNSUPPORTED_VERSION2 = 7050018;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_WRITABLE_ACCOUNT2 = 7050019;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_ACCOUNT_COST_LIMIT2 = 7050020;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_BLOCK_LIMIT2 = 7050021;
var SOLANA_ERROR__TRANSACTION_ERROR__TOO_MANY_ACCOUNT_LOCKS2 = 7050022;
var SOLANA_ERROR__TRANSACTION_ERROR__ADDRESS_LOOKUP_TABLE_NOT_FOUND2 = 7050023;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_OWNER2 = 7050024;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_DATA2 = 7050025;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_INDEX2 = 7050026;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_RENT_PAYING_ACCOUNT2 = 7050027;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_VOTE_COST_LIMIT2 = 7050028;
var SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_TOTAL_LIMIT2 = 7050029;
var SOLANA_ERROR__TRANSACTION_ERROR__DUPLICATE_INSTRUCTION2 = 7050030;
var SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_RENT2 = 7050031;
var SOLANA_ERROR__TRANSACTION_ERROR__MAX_LOADED_ACCOUNTS_DATA_SIZE_EXCEEDED2 = 7050032;
var SOLANA_ERROR__TRANSACTION_ERROR__INVALID_LOADED_ACCOUNTS_DATA_SIZE_LIMIT2 = 7050033;
var SOLANA_ERROR__TRANSACTION_ERROR__RESANITIZATION_NEEDED2 = 7050034;
var SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_EXECUTION_TEMPORARILY_RESTRICTED2 = 7050035;
var SOLANA_ERROR__TRANSACTION_ERROR__UNBALANCED_TRANSACTION2 = 7050036;
var SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN2 = 7618e3;
var SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE2 = 7618001;
var SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN2 = 7618002;
var SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN2 = 7618003;
var SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED2 = 7618004;
var SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND2 = 7618005;
var SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_INSTRUCTION_PLAN2 = 7618006;
var SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN2 = 7618007;
var SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT2 = 7618008;
var SOLANA_ERROR__INSTRUCTION_PLANS__EXPECTED_SUCCESSFUL_TRANSACTION_PLAN_RESULT2 = 7618009;
var SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY2 = 8078e3;
var SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH2 = 8078001;
var SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH2 = 8078002;
var SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH2 = 8078003;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH2 = 8078004;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH2 = 8078005;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH2 = 8078006;
var SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS2 = 8078007;
var SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE2 = 8078008;
var SOLANA_ERROR__CODECS__INVALID_DISCRIMINATED_UNION_VARIANT2 = 8078009;
var SOLANA_ERROR__CODECS__INVALID_ENUM_VARIANT2 = 8078010;
var SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE2 = 8078011;
var SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE2 = 8078012;
var SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH2 = 8078013;
var SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE2 = 8078014;
var SOLANA_ERROR__CODECS__INVALID_LITERAL_UNION_VARIANT2 = 8078015;
var SOLANA_ERROR__CODECS__LITERAL_UNION_DISCRIMINATOR_OUT_OF_RANGE2 = 8078016;
var SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE2 = 8078017;
var SOLANA_ERROR__CODECS__INVALID_CONSTANT2 = 8078018;
var SOLANA_ERROR__CODECS__EXPECTED_ZERO_VALUE_TO_MATCH_ITEM_FIXED_SIZE2 = 8078019;
var SOLANA_ERROR__CODECS__ENCODED_BYTES_MUST_NOT_INCLUDE_SENTINEL2 = 8078020;
var SOLANA_ERROR__CODECS__SENTINEL_MISSING_IN_DECODED_BYTES2 = 8078021;
var SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS2 = 8078022;
var SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY2 = 8078023;
var SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE2 = 8078024;
var SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES2 = 8078025;
var SOLANA_ERROR__RPC__INTEGER_OVERFLOW2 = 81e5;
var SOLANA_ERROR__RPC__TRANSPORT_HTTP_HEADER_FORBIDDEN2 = 8100001;
var SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR2 = 8100002;
var SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD2 = 8100003;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN2 = 819e4;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__EXPECTED_SERVER_SUBSCRIPTION_ID2 = 8190001;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CLOSED_BEFORE_MESSAGE_BUFFERED2 = 8190002;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED2 = 8190003;
var SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT2 = 8190004;
var SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS2 = 85e5;
var SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_INSTRUCTION_TYPE2 = 8500001;
var SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION2 = 8500002;
var SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE2 = 8500003;
var SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL2 = 8500004;
var SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_ACCOUNT_TYPE2 = 8500005;
var SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_ACCOUNT2 = 8500006;
var SOLANA_ERROR__WALLET__NOT_CONNECTED2 = 89e5;
var SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_STATE_MISSING2 = 99e5;
var SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_MUST_NOT_POLL_BEFORE_RESOLVING_EXISTING_MESSAGE_PROMISE2 = 9900001;
var SOLANA_ERROR__INVARIANT_VIOLATION__CACHED_ABORTABLE_ITERABLE_CACHE_ENTRY_MISSING2 = 9900002;
var SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE2 = 9900003;
var SOLANA_ERROR__INVARIANT_VIOLATION__DATA_PUBLISHER_CHANNEL_UNIMPLEMENTED2 = 9900004;
var SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND2 = 9900005;
var SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND2 = 9900006;
function encodeValue2(value) {
  if (Array.isArray(value)) {
    const commaSeparatedValues = value.map(encodeValue2).join(
      "%2C%20"
      /* ", " */
    );
    return "%5B" + commaSeparatedValues + /* "]" */
    "%5D";
  } else if (typeof value === "bigint") {
    return `${value}n`;
  } else {
    return encodeURIComponent(
      String(
        value != null && Object.getPrototypeOf(value) === null ? (
          // Plain objects with no prototype don't have a `toString` method.
          // Convert them before stringifying them.
          { ...value }
        ) : value
      )
    );
  }
}
function encodeObjectContextEntry2([key, value]) {
  return `${key}=${encodeValue2(value)}`;
}
function encodeContextObject2(context) {
  const searchParamsString = Object.entries(context).map(encodeObjectContextEntry2).join("&");
  return Buffer.from(searchParamsString, "utf8").toString("base64");
}
var SolanaErrorMessages2 = {
  [SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND2]: "Account not found at address: $address",
  [SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED2]: "Not all accounts were decoded. Encoded accounts found at addresses: $addresses.",
  [SOLANA_ERROR__ACCOUNTS__EXPECTED_DECODED_ACCOUNT2]: "Expected decoded account at address: $address",
  [SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT2]: "Failed to decode account data at address: $address",
  [SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND2]: "Accounts not found at addresses: $addresses",
  [SOLANA_ERROR__ADDRESSES__FAILED_TO_FIND_VIABLE_PDA_BUMP_SEED2]: "Unable to find a viable program address bump seed.",
  [SOLANA_ERROR__ADDRESSES__INVALID_BASE58_ENCODED_ADDRESS2]: "$putativeAddress is not a base58-encoded address.",
  [SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH2]: "Expected base58 encoded address to decode to a byte array of length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__ADDRESSES__INVALID_ED25519_PUBLIC_KEY2]: "The `CryptoKey` must be an `Ed25519` public key.",
  [SOLANA_ERROR__ADDRESSES__INVALID_OFF_CURVE_ADDRESS2]: "$putativeOffCurveAddress is not a base58-encoded off-curve address.",
  [SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE2]: "Invalid seeds; point must fall off the Ed25519 curve.",
  [SOLANA_ERROR__ADDRESSES__MALFORMED_PDA2]: "Expected given program derived address to have the following format: [Address, ProgramDerivedAddressBump].",
  [SOLANA_ERROR__ADDRESSES__MAX_NUMBER_OF_PDA_SEEDS_EXCEEDED2]: "A maximum of $maxSeeds seeds, including the bump seed, may be supplied when creating an address. Received: $actual.",
  [SOLANA_ERROR__ADDRESSES__MAX_PDA_SEED_LENGTH_EXCEEDED2]: "The seed at index $index with length $actual exceeds the maximum length of $maxSeedLength bytes.",
  [SOLANA_ERROR__ADDRESSES__PDA_BUMP_SEED_OUT_OF_RANGE2]: "Expected program derived address bump to be in the range [0, 255], got: $bump.",
  [SOLANA_ERROR__ADDRESSES__PDA_ENDS_WITH_PDA_MARKER2]: "Program address cannot end with PDA marker.",
  [SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE2]: "Expected base58-encoded address string of length in the range [32, 44]. Actual length: $actualLength.",
  [SOLANA_ERROR__BLOCKHASH_STRING_LENGTH_OUT_OF_RANGE2]: "Expected base58-encoded blockhash string of length in the range [32, 44]. Actual length: $actualLength.",
  [SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED2]: "The network has progressed past the last block for which this transaction could have been committed.",
  [SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY2]: "Codec [$codecDescription] cannot decode empty byte arrays.",
  [SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS2]: "Enum codec cannot use lexical values [$stringValues] as discriminators. Either remove all lexical values or set `useValuesAsDiscriminators` to `false`.",
  [SOLANA_ERROR__CODECS__ENCODED_BYTES_MUST_NOT_INCLUDE_SENTINEL2]: "Sentinel [$hexSentinel] must not be present in encoded bytes [$hexEncodedBytes].",
  [SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH2]: "Encoder and decoder must have the same fixed size, got [$encoderFixedSize] and [$decoderFixedSize].",
  [SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH2]: "Encoder and decoder must have the same max size, got [$encoderMaxSize] and [$decoderMaxSize].",
  [SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH2]: "Encoder and decoder must either both be fixed-size or variable-size.",
  [SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE2]: "Enum discriminator out of range. Expected a number in [$formattedValidDiscriminators], got $discriminator.",
  [SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH2]: "Expected a fixed-size codec, got a variable-size one.",
  [SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH2]: "Codec [$codecDescription] expected a positive byte length, got $bytesLength.",
  [SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH2]: "Expected a variable-size codec, got a fixed-size one.",
  [SOLANA_ERROR__CODECS__EXPECTED_ZERO_VALUE_TO_MATCH_ITEM_FIXED_SIZE2]: "Codec [$codecDescription] expected zero-value [$hexZeroValue] to have the same size as the provided fixed-size item [$expectedSize bytes].",
  [SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH2]: "Codec [$codecDescription] expected $expected bytes, got $bytesLength.",
  [SOLANA_ERROR__CODECS__INVALID_CONSTANT2]: "Expected byte array constant [$hexConstant] to be present in data [$hexData] at offset [$offset].",
  [SOLANA_ERROR__CODECS__INVALID_DISCRIMINATED_UNION_VARIANT2]: "Invalid discriminated union variant. Expected one of [$variants], got $value.",
  [SOLANA_ERROR__CODECS__INVALID_ENUM_VARIANT2]: "Invalid enum variant. Expected one of [$stringValues] or a number in [$formattedNumericalValues], got $variant.",
  [SOLANA_ERROR__CODECS__INVALID_LITERAL_UNION_VARIANT2]: "Invalid literal union variant. Expected one of [$variants], got $value.",
  [SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS2]: "Expected [$codecDescription] to have $expected items, got $actual.",
  [SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE2]: "Invalid value $value for base $base with alphabet $alphabet.",
  [SOLANA_ERROR__CODECS__LITERAL_UNION_DISCRIMINATOR_OUT_OF_RANGE2]: "Literal union discriminator out of range. Expected a number between $minRange and $maxRange, got $discriminator.",
  [SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE2]: "Codec [$codecDescription] expected number to be in the range [$min, $max], got $value.",
  [SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE2]: "Codec [$codecDescription] expected offset to be in the range [0, $bytesLength], got $offset.",
  [SOLANA_ERROR__CODECS__SENTINEL_MISSING_IN_DECODED_BYTES2]: "Expected sentinel [$hexSentinel] to be present in decoded bytes [$hexDecodedBytes].",
  [SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE2]: "Union variant out of range. Expected an index between $minRange and $maxRange, got $variant.",
  [SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY2]: "This decoder expected a byte array of exactly $expectedLength bytes, but $numExcessBytes unexpected excess bytes remained after decoding. Are you sure that you have chosen the correct decoder for this data?",
  [SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE2]: "Invalid pattern match value. The provided value does not match any of the specified patterns.",
  [SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES2]: "Invalid pattern match bytes. The provided byte array does not match any of the specified patterns.",
  [SOLANA_ERROR__CRYPTO__RANDOM_VALUES_FUNCTION_UNIMPLEMENTED2]: "No random values implementation could be found.",
  [SOLANA_ERROR__FAILED_TO_SEND_TRANSACTION2]: "Failed to send transaction$causeMessage",
  [SOLANA_ERROR__FAILED_TO_SEND_TRANSACTIONS2]: "Failed to send transactions$causeMessages",
  [SOLANA_ERROR__FS__UNSUPPORTED_ENVIRONMENT2]: "Filesystem operation `$operation` is not supported in this environment.",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_ALREADY_INITIALIZED2]: "Instruction requires an uninitialized account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_FAILED2]: "Instruction tries to borrow reference for an account which is already borrowed",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_BORROW_OUTSTANDING2]: "Instruction left account with an outstanding borrowed reference",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_SIZE_CHANGED2]: "Program other than the account's owner changed the size of the account data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_DATA_TOO_SMALL2]: "Account data too small for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_EXECUTABLE2]: "Instruction expected an executable account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ACCOUNT_NOT_RENT_EXEMPT2]: "An account does not have enough lamports to be rent-exempt",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ARITHMETIC_OVERFLOW2]: "Program arithmetic overflowed",
  [SOLANA_ERROR__INSTRUCTION_ERROR__BORSH_IO_ERROR2]: "Failed to serialize or deserialize account data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__BUILTIN_PROGRAMS_MUST_CONSUME_COMPUTE_UNITS2]: "Builtin programs must consume compute units",
  [SOLANA_ERROR__INSTRUCTION_ERROR__CALL_DEPTH2]: "Cross-program invocation call depth too deep",
  [SOLANA_ERROR__INSTRUCTION_ERROR__COMPUTATIONAL_BUDGET_EXCEEDED2]: "Computational budget exceeded",
  [SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM2]: "Custom program error: #$code",
  [SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_INDEX2]: "Instruction contains duplicate accounts",
  [SOLANA_ERROR__INSTRUCTION_ERROR__DUPLICATE_ACCOUNT_OUT_OF_SYNC2]: "Instruction modifications of multiply-passed account differ",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_ACCOUNT_NOT_RENT_EXEMPT2]: "Executable accounts must be rent exempt",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_DATA_MODIFIED2]: "Instruction changed executable accounts data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_LAMPORT_CHANGE2]: "Instruction changed the balance of an executable account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXECUTABLE_MODIFIED2]: "Instruction changed executable bit of an account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_DATA_MODIFIED2]: "Instruction modified data of an account it does not own",
  [SOLANA_ERROR__INSTRUCTION_ERROR__EXTERNAL_ACCOUNT_LAMPORT_SPEND2]: "Instruction spent from the balance of an account it does not own",
  [SOLANA_ERROR__INSTRUCTION_ERROR__GENERIC_ERROR2]: "Generic instruction error",
  [SOLANA_ERROR__INSTRUCTION_ERROR__ILLEGAL_OWNER2]: "Provided owner is not allowed",
  [SOLANA_ERROR__INSTRUCTION_ERROR__IMMUTABLE2]: "Account is immutable",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_AUTHORITY2]: "Incorrect authority provided",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INCORRECT_PROGRAM_ID2]: "Incorrect program id for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS2]: "Insufficient funds for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_DATA2]: "Invalid account data for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ACCOUNT_OWNER2]: "Invalid account owner",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ARGUMENT2]: "Invalid program argument",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_ERROR2]: "Program returned invalid error code",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_INSTRUCTION_DATA2]: "Invalid instruction data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_REALLOC2]: "Failed to reallocate account data",
  [SOLANA_ERROR__INSTRUCTION_ERROR__INVALID_SEEDS2]: "Provided seeds do not result in a valid address",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_DATA_ALLOCATIONS_EXCEEDED2]: "Accounts data allocations exceeded the maximum allowed per transaction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_ACCOUNTS_EXCEEDED2]: "Max accounts exceeded",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_INSTRUCTION_TRACE_LENGTH_EXCEEDED2]: "Max instruction trace length exceeded",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MAX_SEED_LENGTH_EXCEEDED2]: "Length of the seed is too long for address generation",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_ACCOUNT2]: "An account required by the instruction is missing",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MISSING_REQUIRED_SIGNATURE2]: "Missing required signature for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__MODIFIED_PROGRAM_ID2]: "Instruction illegally modified the program id of an account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__NOT_ENOUGH_ACCOUNT_KEYS2]: "Insufficient account keys for instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PRIVILEGE_ESCALATION2]: "Cross-program invocation with unauthorized signer or writable account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_ENVIRONMENT_SETUP_FAILURE2]: "Failed to create program execution environment",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPILE2]: "Program failed to compile",
  [SOLANA_ERROR__INSTRUCTION_ERROR__PROGRAM_FAILED_TO_COMPLETE2]: "Program failed to complete",
  [SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_DATA_MODIFIED2]: "Instruction modified data of a read-only account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__READONLY_LAMPORT_CHANGE2]: "Instruction changed the balance of a read-only account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__REENTRANCY_NOT_ALLOWED2]: "Cross-program invocation reentrancy not allowed for this instruction",
  [SOLANA_ERROR__INSTRUCTION_ERROR__RENT_EPOCH_MODIFIED2]: "Instruction modified rent epoch of an account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNBALANCED_INSTRUCTION2]: "Sum of account balances before and after instruction do not match",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNINITIALIZED_ACCOUNT2]: "Instruction requires an initialized account",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN2]: "The instruction failed with the error: $errorName",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_PROGRAM_ID2]: "Unsupported program id",
  [SOLANA_ERROR__INSTRUCTION_ERROR__UNSUPPORTED_SYSVAR2]: "Unsupported sysvar",
  [SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND2]: "Invalid instruction plan kind: $kind.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN2]: "The provided instruction plan is empty.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND2]: "No failed transaction plan result was found in the provided transaction plan result.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__NON_DIVISIBLE_TRANSACTION_PLANS_NOT_SUPPORTED2]: "This transaction plan executor does not support non-divisible sequential plans. To support them, you may create your own executor such that multi-transaction atomicity is preserved \u2014 e.g. by targetting RPCs that support transaction bundles.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN2]: "The provided transaction plan failed to execute. See the `transactionPlanResult` attribute for more details. Note that the `cause` property is deprecated, and a future version will not set it.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN2]: "The provided message has insufficient capacity to accommodate the next instruction(s) in this plan. Expected at least $numBytesRequired free byte(s), got $numFreeBytes byte(s).",
  [SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND2]: "Invalid transaction plan kind: $kind.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE2]: "No more instructions to pack; the message packer has completed the instruction plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_INSTRUCTION_PLAN2]: "Unexpected instruction plan. Expected $expectedKind plan, got $actualKind plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN2]: "Unexpected transaction plan. Expected $expectedKind plan, got $actualKind plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN_RESULT2]: "Unexpected transaction plan result. Expected $expectedKind plan, got $actualKind plan.",
  [SOLANA_ERROR__INSTRUCTION_PLANS__EXPECTED_SUCCESSFUL_TRANSACTION_PLAN_RESULT2]: "Expected a successful transaction plan result. I.e. there is at least one failed or cancelled transaction in the plan.",
  [SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_ACCOUNTS2]: "The instruction does not have any accounts.",
  [SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_DATA2]: "The instruction does not have any data.",
  [SOLANA_ERROR__INSTRUCTION__PROGRAM_ID_MISMATCH2]: "Expected instruction to have progress address $expectedProgramAddress, got $actualProgramAddress.",
  [SOLANA_ERROR__INVALID_BLOCKHASH_BYTE_LENGTH2]: "Expected base58 encoded blockhash to decode to a byte array of length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__INVALID_NONCE2]: "The nonce `$expectedNonceValue` is no longer valid. It has advanced to `$actualNonceValue`",
  [SOLANA_ERROR__INVARIANT_VIOLATION__CACHED_ABORTABLE_ITERABLE_CACHE_ENTRY_MISSING2]: "Invariant violation: Found no abortable iterable cache entry for key `$cacheKey`. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__INVARIANT_VIOLATION__DATA_PUBLISHER_CHANNEL_UNIMPLEMENTED2]: "Invariant violation: This data publisher does not publish to the channel named `$channelName`. Supported channels include $supportedChannelNames.",
  [SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_MUST_NOT_POLL_BEFORE_RESOLVING_EXISTING_MESSAGE_PROMISE2]: "Invariant violation: WebSocket message iterator state is corrupt; iterated without first resolving existing message promise. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__INVARIANT_VIOLATION__SUBSCRIPTION_ITERATOR_STATE_MISSING2]: "Invariant violation: WebSocket message iterator is missing state storage. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE2]: "Invariant violation: Switch statement non-exhaustive. Received unexpected value `$unexpectedValue`. It should be impossible to hit this error; please file an issue at https://sola.na/web3invariant",
  [SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR2]: "JSON-RPC error: Internal JSON-RPC error ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__INVALID_PARAMS2]: "JSON-RPC error: Invalid method parameter(s) ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__INVALID_REQUEST2]: "JSON-RPC error: The JSON sent is not a valid `Request` object ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND2]: "JSON-RPC error: The method does not exist / is not available ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__PARSE_ERROR2]: "JSON-RPC error: An error occurred on the server while parsing the JSON text ($__serverMessage)",
  [SOLANA_ERROR__JSON_RPC__SCAN_ERROR2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_EPOCH_REWARDS_PERIOD_ACTIVE2]: "Epoch rewards period still active at slot $slot",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_UNREACHABLE2]: "Failed to query long-term storage; please try again",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED2]: "Minimum context slot has not been reached",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY2]: "Node is unhealthy; behind by $numSlotsBehind slots",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT2]: "No snapshot",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE2]: "Transaction simulation failed",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_NOT_EPOCH_BOUNDARY2]: "Rewards cannot be found because slot $slot is not the epoch boundary. This may be due to gap in the queried node's local ledger or long-term storage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE2]: "Transaction history is not available from this node",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_PRECOMPILE_VERIFICATION_FAILURE2]: "$__serverMessage",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_LEN_MISMATCH2]: "Transaction signature length mismatch",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_SIGNATURE_VERIFICATION_FAILURE2]: "Transaction signature verification failure",
  [SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION2]: "$__serverMessage",
  [SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX2]: "The grind regex `/$source/` contains the character `$character`, which is not in the base58 alphabet and can never match a Solana address.",
  [SOLANA_ERROR__KEYS__INVALID_KEY_PAIR_BYTE_LENGTH2]: "Key pair bytes must be of length 64, got $byteLength.",
  [SOLANA_ERROR__KEYS__INVALID_PRIVATE_KEY_BYTE_LENGTH2]: "Expected private key bytes with length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH2]: "Expected base58-encoded signature to decode to a byte array of length 64. Actual length: $actualLength.",
  [SOLANA_ERROR__KEYS__PUBLIC_KEY_MUST_MATCH_PRIVATE_KEY2]: "The provided private key does not match the provided public key.",
  [SOLANA_ERROR__KEYS__SIGNATURE_STRING_LENGTH_OUT_OF_RANGE2]: "Expected base58-encoded signature string of length in the range [64, 88]. Actual length: $actualLength.",
  [SOLANA_ERROR__KEYS__WRITE_KEY_PAIR_UNSUPPORTED_ENVIRONMENT2]: "Writing a key pair to disk is not supported in this environment.",
  [SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE2]: "Lamports value must be in the range [0, 2e64-1]",
  [SOLANA_ERROR__MALFORMED_BIGINT_STRING2]: "`$value` cannot be parsed as a `BigInt`",
  [SOLANA_ERROR__MALFORMED_JSON_RPC_ERROR2]: "$message",
  [SOLANA_ERROR__MALFORMED_NUMBER_STRING2]: "`$value` cannot be parsed as a `Number`",
  [SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND2]: "No nonce account could be found at address `$nonceAccountAddress`",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__INVALID_APPLICATION_DOMAIN_BYTE_LENGTH2]: "Expected base58 encoded application domain to decode to a byte array of length 32. Actual length: $actualLength.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__ADDRESSES_CANNOT_SIGN_OFFCHAIN_MESSAGE2]: "Attempted to sign an offchain message with an address that is not a signer for it",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__APPLICATION_DOMAIN_STRING_LENGTH_OUT_OF_RANGE2]: "Expected base58-encoded application domain string of length in the range [32, 44]. Actual length: $actualLength.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH2]: "The signer addresses in this offchain message envelope do not match the list of required signers in the message preamble. These unexpected signers were present in the envelope: `[$unexpectedSigners]`. These required signers were missing from the envelope `[$missingSigners]`.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED2]: "The message body provided has a byte-length of $actualBytes. The maximum allowable byte-length is $maxBytes",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH2]: "Expected message format $expectedMessageFormat, got $actualMessageFormat",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH2]: "The message length specified in the message preamble is $specifiedLength bytes. The actual length of the message is $actualLength bytes.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY2]: "Offchain message content must be non-empty",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO2]: "Offchain message must specify the address of at least one required signer",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO2]: "Offchain message envelope must reserve space for at least one signature",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH2]: "The offchain message preamble specifies $numRequiredSignatures required signature(s), got $signaturesLength.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_SORTED2]: "The signatories of this offchain message must be listed in lexicographical order",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE2]: "An address must be listed no more than once among the signatories of an offchain message",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING2]: "Offchain message is missing signatures for addresses: $addresses.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURE_VERIFICATION_FAILURE2]: "Offchain message signature verification failed. Signature mismatch for required signatories [$signatoriesWithInvalidSignatures]. Missing signatures for signatories [$signatoriesWithMissingSignatures]",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE2]: "The message body provided contains characters whose codes fall outside the allowed range. In order to ensure clear-signing compatiblity with hardware wallets, the message may only contain line feeds and characters in the range [\\x20-\\x7e].",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION2]: "Expected offchain message version $expectedVersion. Got $actualVersion.",
  [SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED2]: "This version of Kit does not support decoding offchain messages with version $unsupportedVersion. The current max supported version is 0.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_ACCOUNT2]: "The provided account could not be identified as an account from the $programName program.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION2]: "The provided instruction could not be identified as an instruction from the $programName program.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__INSUFFICIENT_ACCOUNT_METAS2]: "The provided instruction is missing some accounts. Expected at least $expectedAccountMetas account(s), got $actualAccountMetas.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL2]: "Expected resolved instruction input '$inputName' to be non-null.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE2]: "Expected resolved instruction input '$inputName' to be of type `$expectedType`.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_ACCOUNT_TYPE2]: "Unrecognized account type '$accountType' for the $programName program.",
  [SOLANA_ERROR__PROGRAM_CLIENTS__UNRECOGNIZED_INSTRUCTION_TYPE2]: "Unrecognized instruction type '$instructionType' for the $programName program.",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CANNOT_CREATE_SUBSCRIPTION_PLAN2]: "The notification name must end in 'Notifications' and the API must supply a subscription plan creator function for the notification '$notificationName'.",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CLOSED_BEFORE_MESSAGE_BUFFERED2]: "WebSocket was closed before payload could be added to the send buffer",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED2]: "WebSocket connection closed",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT2]: "WebSocket failed to connect",
  [SOLANA_ERROR__RPC_SUBSCRIPTIONS__EXPECTED_SERVER_SUBSCRIPTION_ID2]: "Failed to obtain a subscription id from the server",
  [SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD2]: "Could not find an API plan for RPC method: `$method`",
  [SOLANA_ERROR__RPC__INTEGER_OVERFLOW2]: "The $argumentLabel argument to the `$methodName` RPC method$optionalPathLabel was `$value`. This number is unsafe for use with the Solana JSON-RPC because it exceeds `Number.MAX_SAFE_INTEGER`.",
  [SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR2]: "HTTP error ($statusCode): $message",
  [SOLANA_ERROR__RPC__TRANSPORT_HTTP_HEADER_FORBIDDEN2]: "HTTP header(s) forbidden: $headers. Learn more at https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name.",
  [SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS2]: "Multiple distinct signers were identified for address `$address`. Please ensure that you are using the same signer instance for each address.",
  [SOLANA_ERROR__SIGNER__EXPECTED_KEY_PAIR_SIGNER2]: "The provided value does not implement the `KeyPairSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_MODIFYING_SIGNER2]: "The provided value does not implement the `MessageModifyingSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_PARTIAL_SIGNER2]: "The provided value does not implement the `MessagePartialSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_SIGNER2]: "The provided value does not implement any of the `MessageSigner` interfaces",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_MODIFYING_SIGNER2]: "The provided value does not implement the `TransactionModifyingSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_PARTIAL_SIGNER2]: "The provided value does not implement the `TransactionPartialSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SENDING_SIGNER2]: "The provided value does not implement the `TransactionSendingSigner` interface",
  [SOLANA_ERROR__SIGNER__EXPECTED_TRANSACTION_SIGNER2]: "The provided value does not implement any of the `TransactionSigner` interfaces",
  [SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS2]: "More than one `TransactionSendingSigner` was identified.",
  [SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING2]: "No `TransactionSendingSigner` was identified. Please provide a valid `TransactionWithSingleSendingSigner` transaction.",
  [SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION2]: "The wallet account $address cannot be used to create a transaction signer because it does not implement either the `solana:signTransaction` or `solana:signAndSendTransaction` feature. At least one of these features is required. The account supports the following features: $supportedFeatures.",
  [SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED2]: "Wallet account signers do not support signing multiple messages/transactions in a single operation",
  [SOLANA_ERROR__SUBTLE_CRYPTO__CANNOT_EXPORT_NON_EXTRACTABLE_KEY2]: "Cannot export a non-extractable key.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__DIGEST_UNIMPLEMENTED2]: "No digest implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__DISALLOWED_IN_INSECURE_CONTEXT2]: "Cryptographic operations are only allowed in secure browser contexts. Read more here: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__ED25519_ALGORITHM_UNIMPLEMENTED2]: "This runtime does not support the generation of Ed25519 key pairs.\n\nInstall @solana/webcrypto-ed25519-polyfill and call its `install` function before generating keys in environments that do not support Ed25519.\n\nFor a list of runtimes that currently support Ed25519 operations, visit https://github.com/WICG/webcrypto-secure-curves/issues/20.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__EXPORT_FUNCTION_UNIMPLEMENTED2]: "No key export implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__GENERATE_FUNCTION_UNIMPLEMENTED2]: "No key generation implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__SIGN_FUNCTION_UNIMPLEMENTED2]: "No signing implementation could be found.",
  [SOLANA_ERROR__SUBTLE_CRYPTO__VERIFY_FUNCTION_UNIMPLEMENTED2]: "No signature verification implementation could be found.",
  [SOLANA_ERROR__TIMESTAMP_OUT_OF_RANGE2]: "Timestamp value must be in the range [-(2n ** 63n), (2n ** 63n) - 1]. `$value` given",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_BORROW_OUTSTANDING2]: "Transaction processing left an account with an outstanding borrowed reference",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_IN_USE2]: "Account in use",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_LOADED_TWICE2]: "Account loaded twice",
  [SOLANA_ERROR__TRANSACTION_ERROR__ACCOUNT_NOT_FOUND2]: "Attempt to debit an account but found no record of a prior credit.",
  [SOLANA_ERROR__TRANSACTION_ERROR__ADDRESS_LOOKUP_TABLE_NOT_FOUND2]: "Transaction loads an address table account that doesn't exist",
  [SOLANA_ERROR__TRANSACTION_ERROR__ALREADY_PROCESSED2]: "This transaction has already been processed",
  [SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND2]: "Blockhash not found",
  [SOLANA_ERROR__TRANSACTION_ERROR__CALL_CHAIN_TOO_DEEP2]: "Loader call chain is too deep",
  [SOLANA_ERROR__TRANSACTION_ERROR__CLUSTER_MAINTENANCE2]: "Transactions are currently disabled due to cluster maintenance",
  [SOLANA_ERROR__TRANSACTION_ERROR__DUPLICATE_INSTRUCTION2]: "Transaction contains a duplicate instruction ($index) that is not allowed",
  [SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE2]: "Insufficient funds for fee",
  [SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_RENT2]: "Transaction results in an account ($accountIndex) with insufficient funds for rent",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_FOR_FEE2]: "This account may not be used to pay transaction fees",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ACCOUNT_INDEX2]: "Transaction contains an invalid account reference",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_DATA2]: "Transaction loads an address table account with invalid data",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_INDEX2]: "Transaction address table lookup uses an invalid index",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_ADDRESS_LOOKUP_TABLE_OWNER2]: "Transaction loads an address table account with an invalid owner",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_LOADED_ACCOUNTS_DATA_SIZE_LIMIT2]: "LoadedAccountsDataSizeLimit set for transaction must be greater than 0.",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_PROGRAM_FOR_EXECUTION2]: "This program may not be used for executing instructions",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_RENT_PAYING_ACCOUNT2]: "Transaction leaves an account with a lower balance than rent-exempt minimum",
  [SOLANA_ERROR__TRANSACTION_ERROR__INVALID_WRITABLE_ACCOUNT2]: "Transaction loads a writable account that cannot be written",
  [SOLANA_ERROR__TRANSACTION_ERROR__MAX_LOADED_ACCOUNTS_DATA_SIZE_EXCEEDED2]: "Transaction exceeded max loaded accounts data size cap",
  [SOLANA_ERROR__TRANSACTION_ERROR__MISSING_SIGNATURE_FOR_FEE2]: "Transaction requires a fee but has no signature present",
  [SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_ACCOUNT_NOT_FOUND2]: "Attempt to load a program that does not exist",
  [SOLANA_ERROR__TRANSACTION_ERROR__PROGRAM_EXECUTION_TEMPORARILY_RESTRICTED2]: "Execution of the program referenced by account at index $accountIndex is temporarily restricted.",
  [SOLANA_ERROR__TRANSACTION_ERROR__RESANITIZATION_NEEDED2]: "ResanitizationNeeded",
  [SOLANA_ERROR__TRANSACTION_ERROR__SANITIZE_FAILURE2]: "Transaction failed to sanitize accounts offsets correctly",
  [SOLANA_ERROR__TRANSACTION_ERROR__SIGNATURE_FAILURE2]: "Transaction did not pass signature verification",
  [SOLANA_ERROR__TRANSACTION_ERROR__TOO_MANY_ACCOUNT_LOCKS2]: "Transaction locked too many accounts",
  [SOLANA_ERROR__TRANSACTION_ERROR__UNBALANCED_TRANSACTION2]: "Sum of account balances before and after transaction do not match",
  [SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN2]: "The transaction failed with the error `$errorName`",
  [SOLANA_ERROR__TRANSACTION_ERROR__UNSUPPORTED_VERSION2]: "Transaction version is unsupported",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_BLOCK_LIMIT2]: "Transaction would exceed account data limit within the block",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_ACCOUNT_DATA_TOTAL_LIMIT2]: "Transaction would exceed total account data limit",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_ACCOUNT_COST_LIMIT2]: "Transaction would exceed max account limit within the block",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_BLOCK_COST_LIMIT2]: "Transaction would exceed max Block Cost Limit",
  [SOLANA_ERROR__TRANSACTION_ERROR__WOULD_EXCEED_MAX_VOTE_COST_LIMIT2]: "Transaction would exceed max Vote Cost Limit",
  [SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION2]: "Attempted to sign a transaction with an address that is not a signer for it",
  [SOLANA_ERROR__TRANSACTION__ADDRESS_MISSING2]: "Transaction is missing an address at index: $index.",
  [SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES2]: "Transaction has no expected signers therefore it cannot be encoded",
  [SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT2]: "Transaction size $transactionSize exceeds limit of $transactionSizeLimit bytes",
  [SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME2]: "Transaction does not have a blockhash lifetime",
  [SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME2]: "Transaction is not a durable nonce transaction",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING2]: "Contents of these address lookup tables unknown: $lookupTableAddresses",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE2]: "Lookup of address at index $highestRequestedIndex failed for lookup table `$lookupTableAddress`. Highest known index is $highestKnownIndex. The lookup table may have been extended since its contents were retrieved",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING2]: "No fee payer set in CompiledTransaction",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND2]: "Could not find program address at index $index",
  [SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT2]: "Failed to estimate the compute unit consumption for this transaction message. This is likely because simulating the transaction failed. Inspect the `cause` property of this error to learn more",
  [SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT2]: "Transaction failed when it was simulated in order to estimate the compute unit consumption. The compute unit estimate provided is for a transaction that failed when simulated and may not be representative of the compute units this transaction would consume if successful. Inspect the `cause` property of this error to learn more",
  [SOLANA_ERROR__TRANSACTION__FEE_PAYER_MISSING2]: "Transaction is missing a fee payer.",
  [SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING2]: "Could not determine this transaction's signature. Make sure that the transaction has been signed by its fee payer.",
  [SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_FIRST_INSTRUCTION_MUST_BE_ADVANCE_NONCE2]: "Transaction first instruction is not advance nonce account instruction.",
  [SOLANA_ERROR__TRANSACTION__INVALID_NONCE_TRANSACTION_INSTRUCTIONS_MISSING2]: "Transaction with no instructions cannot be durable nonce transaction.",
  [SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_CANNOT_PAY_FEES2]: "This transaction includes an address (`$programAddress`) which is both invoked and set as the fee payer. Program addresses may not pay fees",
  [SOLANA_ERROR__TRANSACTION__INVOKED_PROGRAMS_MUST_NOT_BE_WRITABLE2]: "This transaction includes an address (`$programAddress`) which is both invoked and marked writable. Program addresses may not be writable",
  [SOLANA_ERROR__TRANSACTION__MESSAGE_SIGNATURES_MISMATCH2]: "The transaction message expected the transaction to have $numRequiredSignatures signatures, got $signaturesLength.",
  [SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING2]: "Transaction is missing signatures for addresses: $addresses.",
  [SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_OUT_OF_RANGE2]: "Transaction version must be in the range [0, 127]. `$actualVersion` given",
  [SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED2]: "This version of Kit does not support decoding transactions with version $unsupportedVersion. The current max supported version is 1.",
  [SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE2]: "The transaction has a durable nonce lifetime (with nonce `$nonce`), but the nonce account address is in a lookup table. The lifetime constraint cannot be constructed without fetching the lookup tables for the transaction.",
  [SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS2]: "Invalid transaction config mask: $mask. Bits 0 and 1 must match (both set or both unset)",
  [SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES2]: "Transaction message bytes are malformed: $messageBytes",
  [SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_MESSAGE_BYTES2]: "Transaction message bytes are empty, so the transaction cannot be encoded",
  [SOLANA_ERROR__TRANSACTION__CANNOT_DECODE_EMPTY_TRANSACTION_BYTES2]: "Transaction bytes are empty, so no transaction can be decoded",
  [SOLANA_ERROR__TRANSACTION__VERSION_ZERO_MUST_BE_ENCODED_WITH_SIGNATURES_FIRST2]: "Transaction version 0 must be encoded with signatures first. This transaction was encoded with first byte $firstByte, which is expected to be a signature count for v0 transactions.",
  [SOLANA_ERROR__TRANSACTION__SIGNATURE_COUNT_TOO_HIGH_FOR_TRANSACTION_BYTES2]: "The provided transaction bytes expect that there should be $numExpectedSignatures signatures, but the bytes are not long enough to contain a transaction message with this many signatures. The provided bytes are $transactionBytesLength bytes long.",
  [SOLANA_ERROR__TRANSACTION__INVALID_NONCE_ACCOUNT_INDEX2]: "The transaction has a durable nonce lifetime, but the nonce account index is invalid. Expected a nonce account index less than $numberOfStaticAccounts, got $nonceAccountIndex.",
  [SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND2]: "The transaction config value for $configName has the incorrect kind. Expected $expectedKind, got $actualKind.",
  [SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH2]: "The transaction does not have the same number of instruction headers and instruction payloads. Got $numInstructionHeaders instruction headers, and $numInstructionPayloads instruction payloads.",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES2]: "Transaction has $actualCount unique signer addresses but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES2]: "Transaction has $actualCount unique account addresses but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS2]: "Transaction has $actualCount instructions but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION2]: "The instruction at index $instructionIndex has $actualCount account references but the maximum allowed is $maxAllowed",
  [SOLANA_ERROR__WALLET__NOT_CONNECTED2]: "Cannot $operation: no wallet connected"
};
var INSTRUCTION_ERROR_RANGE_SIZE2 = 1e3;
var START_INDEX2 = "i";
var TYPE3 = "t";
function getHumanReadableErrorMessage2(code, context = {}) {
  const messageFormatString = SolanaErrorMessages2[code];
  if (messageFormatString.length === 0) {
    return "";
  }
  let state;
  function commitStateUpTo(endIndex) {
    if (state[TYPE3] === 2) {
      const variableName = messageFormatString.slice(state[START_INDEX2] + 1, endIndex);
      fragments.push(
        variableName in context ? (
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `${context[variableName]}`
        ) : `$${variableName}`
      );
    } else if (state[TYPE3] === 1) {
      fragments.push(messageFormatString.slice(state[START_INDEX2], endIndex));
    }
  }
  const fragments = [];
  messageFormatString.split("").forEach((char, ii) => {
    if (ii === 0) {
      state = {
        [START_INDEX2]: 0,
        [TYPE3]: messageFormatString[0] === "\\" ? 0 : messageFormatString[0] === "$" ? 2 : 1
        /* Text */
      };
      return;
    }
    let nextState;
    switch (state[TYPE3]) {
      case 0:
        nextState = {
          [START_INDEX2]: ii,
          [TYPE3]: 1
          /* Text */
        };
        break;
      case 1:
        if (char === "\\") {
          nextState = {
            [START_INDEX2]: ii,
            [TYPE3]: 0
            /* EscapeSequence */
          };
        } else if (char === "$") {
          nextState = {
            [START_INDEX2]: ii,
            [TYPE3]: 2
            /* Variable */
          };
        }
        break;
      case 2:
        if (char === "\\") {
          nextState = {
            [START_INDEX2]: ii,
            [TYPE3]: 0
            /* EscapeSequence */
          };
        } else if (char === "$") {
          nextState = {
            [START_INDEX2]: ii,
            [TYPE3]: 2
            /* Variable */
          };
        } else if (!char.match(/\w/)) {
          nextState = {
            [START_INDEX2]: ii,
            [TYPE3]: 1
            /* Text */
          };
        }
        break;
    }
    if (nextState) {
      if (state !== nextState) {
        commitStateUpTo(ii);
      }
      state = nextState;
    }
  });
  commitStateUpTo();
  let message = fragments.join("");
  if (code >= SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN2 && code < SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN2 + INSTRUCTION_ERROR_RANGE_SIZE2 && "index" in context) {
    message += ` (instruction #${context.index + 1})`;
  }
  return message;
}
function getErrorMessage2(code, context = {}) {
  if (process.env.NODE_ENV !== "production") {
    return getHumanReadableErrorMessage2(code, context);
  } else {
    let decodingAdviceMessage = `Solana error #${code}; Decode this error by running \`npx @solana/errors decode -- ${code}`;
    if (Object.keys(context).length) {
      decodingAdviceMessage += ` '${encodeContextObject2(context)}'`;
    }
    return `${decodingAdviceMessage}\``;
  }
}
var SolanaError2 = class extends Error {
  /**
   * Indicates the root cause of this {@link SolanaError}, if any.
   *
   * For example, a transaction error might have an instruction error as its root cause. In this
   * case, you will be able to access the instruction error on the transaction error as `cause`.
   */
  cause = this.cause;
  /**
   * Contains context that can assist in understanding or recovering from a {@link SolanaError}.
   */
  context;
  constructor(...[code, contextAndErrorOptions]) {
    let context;
    let errorOptions;
    if (contextAndErrorOptions) {
      Object.entries(Object.getOwnPropertyDescriptors(contextAndErrorOptions)).forEach(([name, descriptor]) => {
        if (name === "cause") {
          errorOptions = { cause: descriptor.value };
        } else {
          if (context === void 0) {
            context = {
              __code: code
            };
          }
          Object.defineProperty(context, name, descriptor);
        }
      });
    }
    const message = getErrorMessage2(code, context);
    super(message, errorOptions);
    this.context = Object.freeze(
      context === void 0 ? {
        __code: code
      } : context
    );
    this.name = "SolanaError";
  }
};

// node_modules/.pnpm/@solana+codecs-core@6.8.0_typescript@6.0.3/node_modules/@solana/codecs-core/dist/index.node.mjs
function getEncodedSize2(value, encoder) {
  return "fixedSize" in encoder ? encoder.fixedSize : encoder.getSizeFromValue(value);
}
function createEncoder2(encoder) {
  return Object.freeze({
    ...encoder,
    encode: (value) => {
      const bytes = new Uint8Array(getEncodedSize2(value, encoder));
      encoder.write(value, bytes, 0);
      return bytes;
    }
  });
}
function isFixedSize2(codec) {
  return "fixedSize" in codec && typeof codec.fixedSize === "number";
}
function isVariableSize2(codec) {
  return !isFixedSize2(codec);
}
function transformEncoder2(encoder, unmap) {
  return createEncoder2({
    ...isVariableSize2(encoder) ? { ...encoder, getSizeFromValue: (value) => encoder.getSizeFromValue(unmap(value)) } : encoder,
    write: (value, bytes, offset) => encoder.write(unmap(value), bytes, offset)
  });
}

// node_modules/.pnpm/@solana+codecs-numbers@6.8.0_typescript@6.0.3/node_modules/@solana/codecs-numbers/dist/index.node.mjs
function assertNumberIsBetweenForCodec2(codecDescription, min, max, value) {
  if (value < min || value > max) {
    throw new SolanaError2(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE2, {
      codecDescription,
      max,
      min,
      value
    });
  }
}
function isLittleEndian2(config) {
  return config?.endian === 1 ? false : true;
}
function numberEncoderFactory2(input) {
  return createEncoder2({
    fixedSize: input.size,
    write(value, bytes, offset) {
      if (input.range) {
        assertNumberIsBetweenForCodec2(input.name, input.range[0], input.range[1], value);
      }
      const arrayBuffer = new ArrayBuffer(input.size);
      input.set(new DataView(arrayBuffer), value, isLittleEndian2(input.config));
      bytes.set(new Uint8Array(arrayBuffer), offset);
      return offset + input.size;
    }
  });
}
var getU32Encoder2 = (config = {}) => numberEncoderFactory2({
  config,
  name: "u32",
  range: [0, Number("0xffffffff")],
  set: (view, value, le) => view.setUint32(0, Number(value), le),
  size: 4
});
var getU64Encoder2 = (config = {}) => numberEncoderFactory2({
  config,
  name: "u64",
  range: [0n, BigInt("0xffffffffffffffff")],
  set: (view, value, le) => view.setBigUint64(0, BigInt(value), le),
  size: 8
});

// node_modules/.pnpm/@solana+codecs-data-structures@6.8.0_typescript@6.0.3/node_modules/@solana/codecs-data-structures/dist/index.node.mjs
function sumCodecSizes2(sizes) {
  return sizes.reduce((all, size) => all === null || size === null ? null : all + size, 0);
}
function getFixedSize2(codec) {
  return isFixedSize2(codec) ? codec.fixedSize : null;
}
function getMaxSize2(codec) {
  return isFixedSize2(codec) ? codec.fixedSize : codec.maxSize ?? null;
}
function getStructEncoder2(fields) {
  const fieldCodecs = fields.map(([, codec]) => codec);
  const fixedSize = sumCodecSizes2(fieldCodecs.map(getFixedSize2));
  const maxSize = sumCodecSizes2(fieldCodecs.map(getMaxSize2)) ?? void 0;
  return createEncoder2({
    ...fixedSize === null ? {
      getSizeFromValue: (value) => fields.map(([key, codec]) => getEncodedSize2(value[key], codec)).reduce((all, one) => all + one, 0),
      maxSize
    } : { fixedSize },
    write: (struct, bytes, offset) => {
      fields.forEach(([key, codec]) => {
        offset = codec.write(struct[key], bytes, offset);
      });
      return offset;
    }
  });
}

// node_modules/.pnpm/@solana+instructions@6.8.0_typescript@6.0.3/node_modules/@solana/instructions/dist/index.node.mjs
var AccountRole2 = /* @__PURE__ */ ((AccountRole22) => {
  AccountRole22[AccountRole22["WRITABLE_SIGNER"] = /* 3 */
  3] = "WRITABLE_SIGNER";
  AccountRole22[AccountRole22["READONLY_SIGNER"] = /* 2 */
  2] = "READONLY_SIGNER";
  AccountRole22[AccountRole22["WRITABLE"] = /* 1 */
  1] = "WRITABLE";
  AccountRole22[AccountRole22["READONLY"] = /* 0 */
  0] = "READONLY";
  return AccountRole22;
})(AccountRole2 || {});
var IS_SIGNER_BITMASK = 2;
function upgradeRoleToSigner(role) {
  return role | IS_SIGNER_BITMASK;
}

// node_modules/.pnpm/@solana+signers@6.8.0_typescript@6.0.3/node_modules/@solana/signers/dist/index.node.mjs
function isTransactionModifyingSigner2(value) {
  return "modifyAndSignTransactions" in value && typeof value.modifyAndSignTransactions === "function";
}
function isTransactionPartialSigner2(value) {
  return "signTransactions" in value && typeof value.signTransactions === "function";
}
function isTransactionSendingSigner2(value) {
  return "signAndSendTransactions" in value && typeof value.signAndSendTransactions === "function";
}
function isTransactionSigner2(value) {
  return isTransactionPartialSigner2(value) || isTransactionModifyingSigner2(value) || isTransactionSendingSigner2(value);
}
var o3 = globalThis.TextEncoder;

// node_modules/.pnpm/@solana+program-client-core@6.8.0_typescript@6.0.3/node_modules/@solana/program-client-core/dist/index.node.mjs
function getNonNullResolvedInstructionInput(inputName, value) {
  if (value === null || value === void 0) {
    throw new SolanaError2(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL2, {
      inputName
    });
  }
  return value;
}
function getAddressFromResolvedInstructionAccount(inputName, value) {
  const nonNullValue = getNonNullResolvedInstructionInput(inputName, value);
  if (typeof value === "object" && "address" in nonNullValue) {
    return nonNullValue.address;
  }
  if (Array.isArray(nonNullValue)) {
    return nonNullValue[0];
  }
  return nonNullValue;
}
function getAccountMetaFactory(programAddress, optionalAccountStrategy) {
  return (inputName, account) => {
    if (!account.value) {
      if (optionalAccountStrategy === "omitted") return;
      return Object.freeze({ address: programAddress, role: AccountRole2.READONLY });
    }
    const writableRole = account.isWritable ? AccountRole2.WRITABLE : AccountRole2.READONLY;
    const isSigner = isResolvedInstructionAccountSigner(account.value);
    return Object.freeze({
      address: getAddressFromResolvedInstructionAccount(inputName, account.value),
      role: isSigner ? upgradeRoleToSigner(writableRole) : writableRole,
      ...isSigner ? { signer: account.value } : {}
    });
  };
}
function isResolvedInstructionAccountSigner(value) {
  return !!value && typeof value === "object" && "address" in value && typeof value.address === "string" && isTransactionSigner2(value);
}

// node_modules/.pnpm/@solana-program+system@0.12.0_@solana+kit@6.8.0_typescript@6.0.3_/node_modules/@solana-program/system/dist/src/index.mjs
var TRANSFER_SOL_DISCRIMINATOR = 2;
function getTransferSolInstructionDataEncoder() {
  return transformEncoder2(
    getStructEncoder2([
      ["discriminator", getU32Encoder2()],
      ["amount", getU64Encoder2()]
    ]),
    (value) => ({ ...value, discriminator: TRANSFER_SOL_DISCRIMINATOR })
  );
}
function getTransferSolInstruction(input, config) {
  const programAddress = config?.programAddress ?? SYSTEM_PROGRAM_ADDRESS2;
  const originalAccounts = {
    source: { value: input.source ?? null, isWritable: true },
    destination: { value: input.destination ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  const getAccountMeta = getAccountMetaFactory(programAddress, "omitted");
  return Object.freeze({
    accounts: [getAccountMeta("source", accounts.source), getAccountMeta("destination", accounts.destination)],
    data: getTransferSolInstructionDataEncoder().encode(args),
    programAddress
  });
}
var SYSTEM_PROGRAM_ADDRESS2 = "11111111111111111111111111111111";
var SYSTEM_ERROR__ACCOUNT_ALREADY_IN_USE = 0;
var SYSTEM_ERROR__RESULT_WITH_NEGATIVE_LAMPORTS = 1;
var SYSTEM_ERROR__INVALID_PROGRAM_ID = 2;
var SYSTEM_ERROR__INVALID_ACCOUNT_DATA_LENGTH = 3;
var SYSTEM_ERROR__MAX_SEED_LENGTH_EXCEEDED = 4;
var SYSTEM_ERROR__ADDRESS_WITH_SEED_MISMATCH = 5;
var SYSTEM_ERROR__NONCE_NO_RECENT_BLOCKHASHES = 6;
var SYSTEM_ERROR__NONCE_BLOCKHASH_NOT_EXPIRED = 7;
var SYSTEM_ERROR__NONCE_UNEXPECTED_BLOCKHASH_VALUE = 8;
var systemErrorMessages;
if (process.env.NODE_ENV !== "production") {
  systemErrorMessages = {
    [SYSTEM_ERROR__ACCOUNT_ALREADY_IN_USE]: `an account with the same address already exists`,
    [SYSTEM_ERROR__ADDRESS_WITH_SEED_MISMATCH]: `provided address does not match addressed derived from seed`,
    [SYSTEM_ERROR__INVALID_ACCOUNT_DATA_LENGTH]: `cannot allocate account data of this length`,
    [SYSTEM_ERROR__INVALID_PROGRAM_ID]: `cannot assign account to this program id`,
    [SYSTEM_ERROR__MAX_SEED_LENGTH_EXCEEDED]: `length of requested seed is too long`,
    [SYSTEM_ERROR__NONCE_BLOCKHASH_NOT_EXPIRED]: `stored nonce is still in recent_blockhashes`,
    [SYSTEM_ERROR__NONCE_NO_RECENT_BLOCKHASHES]: `advancing stored nonce requires a populated RecentBlockhashes sysvar`,
    [SYSTEM_ERROR__NONCE_UNEXPECTED_BLOCKHASH_VALUE]: `specified nonce does not match stored nonce`,
    [SYSTEM_ERROR__RESULT_WITH_NEGATIVE_LAMPORTS]: `account does not have enough SOL to perform the operation`
  };
}

// demo.ts
globalThis.__NODEJS__ = true;
globalThis.__BROWSER__ = false;
async function main() {
  console.log("Starting demo...");
  const rpcUrl = "http://127.0.0.1:8899";
  const rpcWsUrl = "ws://127.0.0.1:8900";
  const rpc = createSolanaRpc(rpcUrl);
  const rpcSubscriptions = createSolanaRpcSubscriptions(rpcWsUrl);
  const sender = await generateKeyPairSigner();
  const receiver = await generateKeyPairSigner();
  console.log(`Sender address: ${sender.address}`);
  console.log(`Receiver address: ${receiver.address}`);
  console.log("Requesting airdrop...");
  await rpc.requestAirdrop(sender.address, lamports(7000000000n), {
    commitment: "confirmed"
  }).send();
  await new Promise((resolve) => setTimeout(resolve, 2e3));
  const balance = await rpc.getBalance(sender.address).send();
  console.log(`Sender balance: ${balance.value} lamports`);
  console.log("Creating transfer transaction...");
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const transferInstruction = getTransferSolInstruction({
    source: sender,
    destination: receiver.address,
    amount: lamports(4000000000n)
  });
  const txMessage = createTransactionMessage({ version: 1 });
  let transactionMessage = setTransactionMessageConfig({
    computeUnitLimit: 2e5,
    loadedAccountsDataSizeLimit: 64 * 1024
  }, txMessage);
  transactionMessage = setTransactionMessageFeePayer(sender.address, transactionMessage);
  transactionMessage = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transactionMessage);
  transactionMessage = appendTransactionMessageInstruction(transferInstruction, transactionMessage);
  console.log("Signing transaction...");
  const signedTx = await signTransactionMessageWithSigners(transactionMessage);
  const signature = getSignatureFromTransaction(signedTx);
  console.log(`Transaction signature: ${signature}`);
  const msgHex = Buffer.from(signedTx.messageBytes).toString("hex");
  console.log(`messageBytes (${signedTx.messageBytes.length} bytes): ${msgHex}`);
  const wireBase64 = getBase64EncodedWireTransaction(signedTx);
  const wireBuf = Buffer.from(wireBase64, "base64");
  console.log(`wire tx (${wireBuf.length} bytes): ${wireBuf.toString("hex")}`);
  console.log(`first byte: 0x${wireBuf[0].toString(16)}`);
  console.log("Sending and confirming transaction...");
  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  await sendAndConfirm(signedTx, { commitment: "confirmed" });
  console.log("Transaction confirmed!");
  const receiverBalance = await rpc.getBalance(receiver.address).send();
  console.log(`Receiver balance: ${receiverBalance.value} lamports`);
}
main().catch(console.error);
