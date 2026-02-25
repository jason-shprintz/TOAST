package com.toast

import android.database.sqlite.SQLiteDatabase
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.maplibre.android.module.http.HttpRequestUtil
import java.io.IOException
import java.net.URLDecoder

/**
 * MbtilesModule
 *
 * React Native module that registers an OkHttp interceptor with MapLibre's HTTP stack at
 * initialisation time. The interceptor catches requests using the mbtiles:// scheme and
 * serves tile blobs directly from the local MBTiles SQLite database — no network required.
 *
 * URL format: mbtiles://<percent-encoded-absolute-path>/<z>/<x>/<y>[.ext]
 *
 * Auto-linked via MbtilesPackage registered in MainApplication.kt.
 */
@ReactModule(name = MbtilesModule.NAME)
class MbtilesModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MbtilesModule"
    }

    override fun getName() = NAME

    override fun initialize() {
        super.initialize()
        // Append the MBTiles interceptor to whatever OkHttpClient MapLibre already has.
        val existing = HttpRequestUtil.getOkHttpClient()
        val client = (existing?.newBuilder() ?: okhttp3.OkHttpClient.Builder())
            .addInterceptor(MbtilesInterceptor())
            .build()
        HttpRequestUtil.setOkHttpClient(client)
    }
}

/**
 * OkHttp interceptor that resolves mbtiles:// tile requests from a local SQLite database.
 */
internal class MbtilesInterceptor : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val url = request.url

        if (url.scheme != "mbtiles") {
            return chain.proceed(request)
        }

        // host holds the percent-encoded absolute path to the .mbtiles file
        val mbtilesPath = URLDecoder.decode(url.host ?: "", "UTF-8")
        val segments = url.pathSegments
        if (segments.size < 3) {
            return buildErrorResponse(request, 400, "Invalid mbtiles URL — expected /<z>/<x>/<y>")
        }

        val z = segments[0].toIntOrNull()
            ?: return buildErrorResponse(request, 400, "Invalid zoom level")
        val x = segments[1].toIntOrNull()
            ?: return buildErrorResponse(request, 400, "Invalid tile column")
        val yRaw = segments[2].substringBefore('.')
        val y = yRaw.toIntOrNull()
            ?: return buildErrorResponse(request, 400, "Invalid tile row")

        // MBTiles uses TMS y-axis (inverted from standard XYZ/slippy-map)
        val tmsY = (1 shl z) - 1 - y

        return try {
            val db = SQLiteDatabase.openDatabase(
                mbtilesPath, null, SQLiteDatabase.OPEN_READONLY
            )
            val cursor = db.rawQuery(
                "SELECT tile_data FROM tiles " +
                "WHERE zoom_level=? AND tile_column=? AND tile_row=?",
                arrayOf(z.toString(), x.toString(), tmsY.toString())
            )

            if (cursor.moveToFirst()) {
                val blob = cursor.getBlob(0)
                cursor.close()
                db.close()
                Response.Builder()
                    .request(request)
                    .protocol(Protocol.HTTP_1_1)
                    .code(200)
                    .message("OK")
                    .body(blob.toResponseBody("image/png".toMediaType()))
                    .build()
            } else {
                cursor.close()
                db.close()
                // Tile not found — return 204 No Content so MapLibre skips gracefully
                buildEmptyResponse(request, 204, "No Content")
            }
        } catch (e: Exception) {
            buildEmptyResponse(request, 500, e.message ?: "Error reading MBTiles")
        }
    }

    private fun buildEmptyResponse(request: okhttp3.Request, code: Int, message: String) =
        Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(code)
            .message(message)
            .body("".toResponseBody(null))
            .build()
}
