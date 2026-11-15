package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Lee eventos de uso (UsageStatsManager) y los convierte en intervalos
 * primer plano -> segundo plano. Solo expone: paquete, etiqueta, categoría del
 * sistema, inicio y fin. No lee contenido de las apps (RNF2 / RF2).
 */
class UsageStatsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    Function("hasPermission") {
      val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      @Suppress("DEPRECATION")
      val mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    AsyncFunction("queryIntervals") { startMs: Double, endMs: Double ->
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val pm = context.packageManager
      val events = usm.queryEvents(startMs.toLong(), endMs.toLong())
      val event = UsageEvents.Event()
      val open = HashMap<String, Long>()
      val out = ArrayList<Map<String, Any?>>()

      fun describe(pkg: String): Pair<String, Int>? {
        // Solo apps con ícono de lanzador, y nunca la propia app.
        if (pkg == context.packageName || pm.getLaunchIntentForPackage(pkg) == null) return null
        return try {
          val info = pm.getApplicationInfo(pkg, 0)
          val label = pm.getApplicationLabel(info).toString()
          val category = if (android.os.Build.VERSION.SDK_INT >= 26) info.category else ApplicationInfo.CATEGORY_UNDEFINED
          Pair(label, category)
        } catch (e: Exception) {
          null
        }
      }

      fun close(pkg: String, endTs: Long) {
        val start = open.remove(pkg) ?: return
        if (endTs <= start) return
        val d = describe(pkg) ?: return
        out.add(mapOf("package" to pkg, "label" to d.first, "category" to d.second, "startMs" to start.toDouble(), "endMs" to endTs.toDouble()))
      }

      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        val pkg = event.packageName ?: continue
        when (event.eventType) {
          UsageEvents.Event.ACTIVITY_RESUMED -> if (!open.containsKey(pkg)) open[pkg] = event.timeStamp
          UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.ACTIVITY_STOPPED -> close(pkg, event.timeStamp)
        }
      }
      // Intervalos que siguen abiertos (app en primer plano ahora).
      open.keys.toList().forEach { close(it, endMs.toLong()) }
      out
    }
  }
}
