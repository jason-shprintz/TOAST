/**
 * MbtilesUrlProtocol
 * NSURLProtocol subclass that intercepts mbtiles:// scheme requests and serves
 * tile blobs directly from the local MBTiles SQLite database.
 *
 * URL format: mbtiles://<percent-encoded-absolute-path>/<z>/<x>/<y>[.ext]
 *
 * The +load method auto-registers the protocol at app launch; no changes to
 * AppDelegate are required.
 */

#import <Foundation/Foundation.h>
#import <sqlite3.h>

@interface MbtilesUrlProtocol : NSURLProtocol
@end

@implementation MbtilesUrlProtocol

+ (void)load {
  [NSURLProtocol registerClass:[MbtilesUrlProtocol class]];
}

+ (BOOL)canInitWithRequest:(NSURLRequest *)request {
  return [request.URL.scheme isEqualToString:@"mbtiles"];
}

+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request {
  return request;
}

+ (BOOL)requestIsCacheEquivalent:(NSURLRequest *)a toRequest:(NSURLRequest *)b {
  return [a.URL isEqual:b.URL];
}

- (void)startLoading {
  NSURL *url = self.request.URL;

  // host holds the percent-encoded absolute path to the .mbtiles file
  NSString *mbtilesPath = [url.host stringByRemovingPercentEncoding];
  if (!mbtilesPath.length) {
    [self failWithMessage:@"Missing MBTiles path in URL host"];
    return;
  }

  // path components: ["", "<z>", "<x>", "<y>[.ext]"]
  NSArray<NSString *> *parts = url.pathComponents;
  if (parts.count < 4) {
    [self failWithMessage:@"Invalid mbtiles:// URL path — expected /<z>/<x>/<y>"];
    return;
  }

  NSInteger z = [parts[1] integerValue];
  NSInteger x = [parts[2] integerValue];

  // Strip optional file extension from the y component
  NSString *yComponent = parts[3];
  NSRange dotRange = [yComponent rangeOfString:@"."];
  NSString *yStr = (dotRange.location != NSNotFound)
      ? [yComponent substringToIndex:dotRange.location]
      : yComponent;
  NSInteger y = [yStr integerValue];

  // MBTiles stores tiles using TMS y-axis (inverted from XYZ)
  NSInteger tmsY = (1L << z) - 1 - y;

  sqlite3 *db = NULL;
  if (sqlite3_open_v2([mbtilesPath UTF8String], &db,
                      SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
    [self failWithMessage:@"Cannot open MBTiles database"];
    return;
  }

  const char *sql =
      "SELECT tile_data FROM tiles "
      "WHERE zoom_level=? AND tile_column=? AND tile_row=?";
  sqlite3_stmt *stmt = NULL;
  if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
    sqlite3_close(db);
    [self failWithMessage:@"Cannot prepare MBTiles SQL statement"];
    return;
  }

  sqlite3_bind_int(stmt, 1, (int)z);
  sqlite3_bind_int(stmt, 2, (int)x);
  sqlite3_bind_int(stmt, 3, (int)tmsY);

  NSData *tileData = nil;
  if (sqlite3_step(stmt) == SQLITE_ROW) {
    const void *bytes = sqlite3_column_blob(stmt, 0);
    int length        = sqlite3_column_bytes(stmt, 0);
    if (bytes && length > 0) {
      tileData = [NSData dataWithBytes:bytes length:(NSUInteger)length];
    }
  }

  sqlite3_finalize(stmt);
  sqlite3_close(db);

  if (tileData) {
    NSHTTPURLResponse *response =
        [[NSHTTPURLResponse alloc] initWithURL:url
                                    statusCode:200
                                   HTTPVersion:@"HTTP/1.1"
                                  headerFields:@{@"Content-Type": @"image/png"}];
    [self.client URLProtocol:self
          didReceiveResponse:response
          cacheStoragePolicy:NSURLCacheStorageNotAllowed];
    [self.client URLProtocol:self didLoadData:tileData];
    [self.client URLProtocolDidFinishLoading:self];
  } else {
    // Tile not found — return 204 No Content so MapLibre skips gracefully
    NSHTTPURLResponse *response =
        [[NSHTTPURLResponse alloc] initWithURL:url
                                    statusCode:204
                                   HTTPVersion:@"HTTP/1.1"
                                  headerFields:@{}];
    [self.client URLProtocol:self
          didReceiveResponse:response
          cacheStoragePolicy:NSURLCacheStorageNotAllowed];
    [self.client URLProtocolDidFinishLoading:self];
  }
}

- (void)stopLoading {
  // No async work to cancel
}

- (void)failWithMessage:(NSString *)message {
  NSError *error = [NSError errorWithDomain:@"MbtilesUrlProtocol"
                                       code:-1
                                   userInfo:@{NSLocalizedDescriptionKey: message}];
  [self.client URLProtocol:self didFailWithError:error];
}

@end
