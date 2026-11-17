package com.safeguard.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class Avisos extends FirebaseMessagingService {

    static final String EXTRA_RUTA = "ruta";

    static void crearCanal(Context contexto) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager gestor = contexto.getSystemService(NotificationManager.class);
        if (gestor == null) return;
        NotificationChannel canal = new NotificationChannel(
                contexto.getString(R.string.canal_avisos),
                contexto.getString(R.string.canal_avisos_nombre),
                NotificationManager.IMPORTANCE_DEFAULT);
        canal.setDescription(contexto.getString(R.string.canal_avisos_descripcion));
        gestor.createNotificationChannel(canal);
    }

    static String rutaSegura(String ruta) {
        if (ruta == null) return null;
        String limpia = ruta.trim();
        if (!limpia.startsWith("/") || limpia.startsWith("//") || limpia.length() > 200) return null;
        return limpia;
    }

    @Override
    public void onNewToken(@NonNull String token) {
        getSharedPreferences(MainActivity.PREFERENCIAS, MODE_PRIVATE)
                .edit()
                .putString("token", token)
                .apply();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage mensaje) {
        Map<String, String> datos = mensaje.getData();
        RemoteMessage.Notification aviso = mensaje.getNotification();
        String titulo = aviso != null && aviso.getTitle() != null ? aviso.getTitle() : datos.get("titulo");
        String texto = aviso != null && aviso.getBody() != null ? aviso.getBody() : datos.get("texto");
        if (titulo == null && texto == null) return;

        crearCanal(this);
        Intent abrir = new Intent(this, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        String ruta = rutaSegura(datos.get(EXTRA_RUTA));
        if (ruta != null) abrir.putExtra(EXTRA_RUTA, ruta);
        PendingIntent pendiente = PendingIntent.getActivity(
                this, (int) System.currentTimeMillis(), abrir,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder nota = new NotificationCompat.Builder(this, getString(R.string.canal_avisos))
                .setSmallIcon(R.drawable.ic_aviso)
                .setColor(ContextCompat.getColor(this, R.color.acento))
                .setContentTitle(titulo != null ? titulo : getString(R.string.app_name))
                .setContentText(texto)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(texto))
                .setAutoCancel(true)
                .setContentIntent(pendiente);

        NotificationManagerCompat gestor = NotificationManagerCompat.from(this);
        if (!gestor.areNotificationsEnabled()) return;
        try {
            gestor.notify((int) System.currentTimeMillis(), nota.build());
        } catch (SecurityException ignorado) {
            return;
        }
    }
}
