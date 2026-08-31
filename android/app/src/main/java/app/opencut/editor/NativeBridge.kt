package app.opencut.editor

import android.app.Activity
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.*
import android.provider.MediaStore
import android.util.Base64
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class NativeBridge(
    private val context: Context,
    private val webView: WebView
) {

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    @JavascriptInterface
    fun isNativeApp(): Boolean = true

    // ==========================================
    // 1. GERENCIAMENTO DE TELA ACESA
    // ==========================================

    @JavascriptInterface
    fun setKeepScreenOn(enable: Boolean) {
        val activity = context as? Activity ?: return
        activity.runOnUiThread {
            if (enable) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    // ==========================================
    // 2. HAPTIC FEEDBACK ENGINE AVANÇADO
    // ==========================================

    enum class HapticFeedbackType {
        SNAP,           // Alinhamento magnético na timeline
        CUT,            // Corte de clipe (Split)
        PLAY_PAUSE,     // Play / Pause
        DELETE,         // Deletar clipe / Ação destrutiva
        KEYFRAME,       // Adição/remoção de keyframe
        GENERIC_CLICK   // Clique simples
    }

    @JavascriptInterface
    fun triggerHapticFeedback(typeStr: String) {
        val type = try {
            HapticFeedbackType.valueOf(typeStr.uppercase())
        } catch (_: Exception) {
            HapticFeedbackType.GENERIC_CLICK
        }

        vibrator?.let { vib ->
            if (!vib.hasVibrator()) return

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val composition = VibrationEffect.startComposition()
                when (type) {
                    HapticFeedbackType.SNAP -> {
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_TICK, 0.4f)
                    }
                    HapticFeedbackType.CUT -> {
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 0.8f)
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_TICK, 0.5f, 20)
                    }
                    HapticFeedbackType.PLAY_PAUSE -> {
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_TICK, 0.3f)
                    }
                    HapticFeedbackType.DELETE -> {
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_THUD, 0.9f)
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_THUD, 0.7f, 40)
                    }
                    HapticFeedbackType.KEYFRAME -> {
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 0.6f)
                    }
                    HapticFeedbackType.GENERIC_CLICK -> {
                        composition.addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 0.5f)
                    }
                }
                vib.vibrate(composition.compose())
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                when (type) {
                    HapticFeedbackType.SNAP -> {
                        vib.vibrate(VibrationEffect.createOneShot(8, 70))
                    }
                    HapticFeedbackType.CUT -> {
                        val timings = longArrayOf(0, 15, 25, 20)
                        val amplitudes = intArrayOf(0, 200, 0, 150)
                        vib.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
                    }
                    HapticFeedbackType.PLAY_PAUSE -> {
                        vib.vibrate(VibrationEffect.createOneShot(12, 60))
                    }
                    HapticFeedbackType.DELETE -> {
                        val timings = longArrayOf(0, 30, 30, 40)
                        val amplitudes = intArrayOf(0, 255, 0, 180)
                        vib.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
                    }
                    HapticFeedbackType.KEYFRAME -> {
                        vib.vibrate(VibrationEffect.createOneShot(15, 120))
                    }
                    HapticFeedbackType.GENERIC_CLICK -> {
                        vib.vibrate(VibrationEffect.createOneShot(10, 100))
                    }
                }
            } else {
                @Suppress("DEPRECATION")
                vib.vibrate(20)
            }
        }
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        triggerHapticFeedback("GENERIC_CLICK")
    }

    // ==========================================
    // 3. GRAVAÇÃO NO MEDIASTORE & INDEXAÇÃO
    // ==========================================

    @JavascriptInterface
    fun saveVideoToGallery(base64Data: String, filename: String): String {
        val resultJson = JSONObject()
        try {
            val base64Clean = if (base64Data.contains("base64,")) {
                base64Data.substringAfter("base64,")
            } else {
                base64Data
            }
            val decodedBytes = Base64.decode(base64Clean, Base64.DEFAULT)
            val cleanFilename = if (filename.endsWith(".mp4")) filename else "$filename.mp4"
            val currentTime = System.currentTimeMillis()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.Video.Media.DISPLAY_NAME, cleanFilename)
                    put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                    put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/OpenCut")
                    put(MediaStore.Video.Media.DATE_ADDED, currentTime / 1000)
                    put(MediaStore.Video.Media.DATE_MODIFIED, currentTime / 1000)
                    put(MediaStore.Video.Media.IS_PENDING, 1)
                }

                val resolver = context.contentResolver
                val videoUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues)
                    ?: throw IllegalStateException("Falha ao criar entrada no MediaStore")

                resolver.openOutputStream(videoUri)?.use { outputStream ->
                    outputStream.write(decodedBytes)
                    outputStream.flush()
                }

                contentValues.clear()
                contentValues.put(MediaStore.Video.Media.IS_PENDING, 0)
                resolver.update(videoUri, contentValues, null, null)

                resultJson.put("success", true)
                resultJson.put("uri", videoUri.toString())
                resultJson.put("path", "Movies/OpenCut/$cleanFilename")
                showToast("Vídeo exportado para a Galeria (Movies/OpenCut)!")
            } else {
                val moviesDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES), "OpenCut")
                if (!moviesDir.exists()) moviesDir.mkdirs()
                val outFile = File(moviesDir, cleanFilename)
                
                FileOutputStream(outFile).use { it.write(decodedBytes) }

                MediaScannerConnection.scanFile(
                    context,
                    arrayOf(outFile.absolutePath),
                    arrayOf("video/mp4"),
                    null
                )

                resultJson.put("success", true)
                resultJson.put("path", outFile.absolutePath)
                showToast("Vídeo exportado com sucesso!")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            resultJson.put("success", false)
            resultJson.put("error", e.localizedMessage ?: "Erro desconhecido")
            showToast("Erro ao exportar vídeo: ${e.localizedMessage}")
        }
        return resultJson.toString()
    }

    // ==========================================
    // 4. COMPARTILHAMENTO NATIVO (FILEPROVIDER & SOCIAL TARGETS)
    // ==========================================

    @JavascriptInterface
    fun shareVideo(title: String, base64DataOrUrl: String, targetPackage: String? = null) {
        try {
            if (base64DataOrUrl.startsWith("data:video") || base64DataOrUrl.length > 500) {
                val base64Clean = base64DataOrUrl.substringAfter("base64,")
                val decodedBytes = Base64.decode(base64Clean, Base64.DEFAULT)
                val tempFile = File(context.cacheDir, "opencut_${System.currentTimeMillis()}.mp4")
                FileOutputStream(tempFile).use { it.write(decodedBytes) }

                val fileUri: Uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    tempFile
                )

                val sendIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "video/mp4"
                    putExtra(Intent.EXTRA_STREAM, fileUri)
                    putExtra(Intent.EXTRA_SUBJECT, title)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                if (!targetPackage.isNullOrEmpty() && isPackageInstalled(targetPackage)) {
                    sendIntent.setPackage(targetPackage)
                    sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(sendIntent)
                } else {
                    val chooser = Intent.createChooser(sendIntent, "Compartilhar Vídeo OpenCut").apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(chooser)
                }
            } else {
                val sendIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, "$title\n$base64DataOrUrl")
                }
                val shareIntent = Intent.createChooser(sendIntent, "Compartilhar com OpenCut").apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(shareIntent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            showToast("Erro ao compartilhar: ${e.localizedMessage}")
        }
    }

    private fun isPackageInstalled(packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        }
    }

    // ==========================================
    // 5. PERMISSÕES GRANULARES (JS INTERFACE)
    // ==========================================

    @JavascriptInterface
    fun requestMediaPermissions() {
        val activity = context as? MainActivity ?: return
        activity.runOnUiThread {
            activity.checkAppPermissions()
        }
    }

    @JavascriptInterface
    fun checkMediaPermissions(): String {
        val activity = context as? MainActivity ?: return "{}"
        val permissions = activity.getRequiredMediaPermissions()
        val result = JSONObject()
        for (perm in permissions) {
            val isGranted = ContextCompat.checkSelfPermission(context, perm) == PackageManager.PERMISSION_GRANTED
            result.put(perm, isGranted)
        }
        return result.toString()
    }

    @JavascriptInterface
    fun showToast(message: String) {
        val activity = context as? Activity
        activity?.runOnUiThread {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        } ?: run {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }
}
