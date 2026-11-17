plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.safeguard.app"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.safeguard.app"
        minSdk = 24
        targetSdk = 37
        versionCode = 5
        versionName = "1.4"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    val archivoFirma = System.getenv("SG_FIRMA_ARCHIVO")
    val claveFirma = System.getenv("SG_FIRMA_CLAVE")

    signingConfigs {
        if (!archivoFirma.isNullOrBlank() && !claveFirma.isNullOrBlank()) {
            create("publicacion") {
                storeFile = file(archivoFirma)
                storePassword = claveFirma
                keyAlias = System.getenv("SG_FIRMA_ALIAS") ?: "safeguard"
                keyPassword = claveFirma
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.findByName("publicacion")
            optimization {
                enable = true
                packageScope = setOf("androidx.**", "kotlin.**", "kotlinx.**")
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.messaging)
    testImplementation(libs.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)
}