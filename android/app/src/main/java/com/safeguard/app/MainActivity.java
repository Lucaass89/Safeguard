package com.safeguard.app;

import android.Manifest;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import java.net.URISyntaxException;

public class MainActivity extends AppCompatActivity {

    private static final String SITIO = "https://safeguardd.vercel.app";

    private WebView sitio;
    private ValueCallback<Uri[]> archivoPendiente;
    private PermissionRequest permisoCamaraPendiente;

    private final ActivityResultLauncher<Intent> elegirArchivo = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            resultado -> {
                ValueCallback<Uri[]> callback = archivoPendiente;
                archivoPendiente = null;
                if (callback != null) {
                    callback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(
                            resultado.getResultCode(), resultado.getData()));
                }
            });

    private final ActivityResultLauncher<String> pedirPermisoCamara = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            concedido -> {
                PermissionRequest pedido = permisoCamaraPendiente;
                permisoCamaraPendiente = null;
                if (pedido == null) return;
                if (concedido) {
                    pedido.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                } else {
                    pedido.deny();
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        setContentView(R.layout.activity_main);

        sitio = findViewById(R.id.sitio);
        View aviso = findViewById(R.id.aviso);
        ProgressBar carga = findViewById(R.id.carga);
        findViewById(R.id.reintentar).setOnClickListener(v -> sitio.reload());

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.raiz), (vista, insets) -> {
            Insets barras = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout()
                            | WindowInsetsCompat.Type.ime());
            vista.setPadding(barras.left, barras.top, barras.right, barras.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        prepararSitio(aviso, carga);
        sitio.loadUrl(SITIO);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (sitio.canGoBack()) {
                    sitio.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    private void prepararSitio(View aviso, ProgressBar carga) {
        WebSettings ajustes = sitio.getSettings();
        ajustes.setJavaScriptEnabled(true);
        ajustes.setDomStorageEnabled(true);
        ajustes.setUseWideViewPort(true);
        ajustes.setLoadWithOverviewMode(true);
        ajustes.setAllowFileAccess(false);
        ajustes.setAllowContentAccess(true);
        ajustes.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        String agente = ajustes.getUserAgentString();
        if (agente != null) {
            // Google rechaza el inicio de sesión si el navegador se anuncia como WebView.
            agente = agente.replace("; wv", "");
            if (!agente.contains("SafeGuardApp")) agente = agente + " SafeGuardApp";
            ajustes.setUserAgentString(agente);
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(sitio, true);

        sitio.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return abrirAfuera(request.getUrl());
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                aviso.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    aviso.setVisibility(View.VISIBLE);
                }
            }
        });

        sitio.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int nuevo) {
                if (nuevo >= 100) {
                    carga.setVisibility(View.GONE);
                } else {
                    carga.setVisibility(View.VISIBLE);
                    carga.setProgress(nuevo);
                }
            }

            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (archivoPendiente != null) {
                    archivoPendiente.onReceiveValue(null);
                }
                archivoPendiente = filePathCallback;
                try {
                    elegirArchivo.launch(fileChooserParams.createIntent());
                    return true;
                } catch (ActivityNotFoundException e) {
                    archivoPendiente = null;
                    return false;
                }
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (!esNuestroSitio(request.getOrigin()) || !pideCamara(request)) {
                    request.deny();
                    return;
                }

                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                } else {
                    permisoCamaraPendiente = request;
                    pedirPermisoCamara.launch(Manifest.permission.CAMERA);
                }
            }
        });

        sitio.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                guardarDescarga(url, userAgent, contentDisposition, mimeType));
    }

    private boolean esNuestroSitio(Uri origen) {
        if (origen == null) return false;
        Uri sitioUri = Uri.parse(SITIO);
        return "https".equalsIgnoreCase(origen.getScheme())
                && sitioUri.getHost() != null
                && sitioUri.getHost().equalsIgnoreCase(origen.getHost());
    }

    private boolean pideCamara(PermissionRequest request) {
        for (String recurso : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(recurso)) return true;
        }
        return false;
    }

    private boolean abrirAfuera(Uri uri) {
        if (uri == null) {
            return true;
        }
        String esquema = uri.getScheme();
        if (esquema == null) {
            return true;
        }
        if ("http".equalsIgnoreCase(esquema) || "https".equalsIgnoreCase(esquema)) {
            return false;
        }
        try {
            Intent intento = "intent".equalsIgnoreCase(esquema)
                    ? Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
                    : new Intent(Intent.ACTION_VIEW, uri);
            if ("intent".equalsIgnoreCase(esquema)) {
                intento.addCategory(Intent.CATEGORY_BROWSABLE);
                intento.setComponent(null);
                intento.setSelector(null);
            }
            startActivity(intento);
        } catch (URISyntaxException | ActivityNotFoundException e) {
            return true;
        }
        return true;
    }

    private void guardarDescarga(String url, String userAgent, String contentDisposition, String mimeType) {
        if (url == null || url.startsWith("blob:") || url.startsWith("data:")) {
            return;
        }
        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        if (manager == null) {
            return;
        }
        String nombre = URLUtil.guessFileName(url, contentDisposition, mimeType);
        DownloadManager.Request pedido = new DownloadManager.Request(Uri.parse(url));
        pedido.setMimeType(mimeType);
        pedido.addRequestHeader("User-Agent", userAgent);
        String cookie = CookieManager.getInstance().getCookie(url);
        if (cookie != null) {
            pedido.addRequestHeader("Cookie", cookie);
        }
        pedido.setTitle(nombre);
        pedido.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            pedido.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nombre);
        } else {
            pedido.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, nombre);
        }
        try {
            manager.enqueue(pedido);
        } catch (IllegalArgumentException | SecurityException ignored) {
            // La página sigue usable si el archivo no se puede guardar.
        }
    }

    @Override
    public void onConfigurationChanged(Configuration nueva) {
        super.onConfigurationChanged(nueva);
        if (sitio != null) {
            sitio.requestLayout();
        }
    }

    @Override
    protected void onPause() {
        sitio.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        sitio.onResume();
    }

    @Override
    protected void onDestroy() {
        if (sitio != null) {
            sitio.stopLoading();
            sitio.destroy();
        }
        super.onDestroy();
    }
}
