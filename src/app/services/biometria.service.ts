import { Injectable } from '@angular/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class BiometriaService {

  private readonly SERVER_KEY = 'ipr_app_biometria_auth';
  private readonly PREF_HABILITADA = 'app_biometria_habilitada';

  /**
   * Checa se o dispositivo possui hardware biométrico disponível e configurado
   */
  async isDisponivel(): Promise<{ disponivel: boolean; biometriaTipo: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { disponivel: false, biometriaTipo: 'none' };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        return { disponivel: false, biometriaTipo: 'none' };
      }

      let tipo = 'Digital / Face ID';
      if (result.biometryType === BiometryType.TOUCH_ID || result.biometryType === BiometryType.FINGERPRINT) {
        tipo = 'Digital';
      } else if (result.biometryType === BiometryType.FACE_ID || result.biometryType === BiometryType.FACE_AUTHENTICATION) {
        tipo = 'Face ID';
      }

      return { disponivel: true, biometriaTipo: tipo };
    } catch (e) {
      console.warn('Biometria não disponível ou erro ao verificar:', e);
      return { disponivel: false, biometriaTipo: 'none' };
    }
  }

  /**
   * Checa se o usuário ativou a biometria para sua conta neste aparelho
   */
  isBiometriaHabilitada(): boolean {
    return localStorage.getItem(this.PREF_HABILITADA) === 'true';
  }

  /**
   * Habilita a biometria e salva as credenciais no Keystore/Keychain de forma segura
   */
  async habilitarBiometria(email: string, senha: string): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Dispara o prompt para confirmar a posse biométrica antes de salvar
        await NativeBiometric.verifyIdentity({
          reason: 'Confirme sua biometria para ativar o login rápido',
          title: 'Ativar Biometria',
          subtitle: 'Autenticação de Segurança',
          description: 'Toque no sensor ou use Face ID para confirmar'
        });

        // Salva as credenciais criptografadas no Keystore/Keychain
        await NativeBiometric.setCredentials({
          server: this.SERVER_KEY,
          username: email,
          password: senha
        });
      }

      localStorage.setItem(this.PREF_HABILITADA, 'true');
      return true;
    } catch (e) {
      console.error('Erro ao habilitar biometria:', e);
      return false;
    }
  }

  /**
   * Desabilita a biometria e remove as credenciais seguras
   */
  async desabilitarBiometria(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await NativeBiometric.deleteCredentials({
          server: this.SERVER_KEY
        });
      }
    } catch (e) {
      console.warn('Erro ao deletar credenciais biométricas:', e);
    } finally {
      localStorage.removeItem(this.PREF_HABILITADA);
    }
  }

  /**
   * Dispara o prompt biométrico do sistema para realizar o login
   */
  async autenticarComBiometria(): Promise<{ email: string; senha: string } | null> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return null;
      }

      // Valida identidade
      await NativeBiometric.verifyIdentity({
        reason: 'Acesse o aplicativo da IPR com sua biometria',
        title: 'Login por Biometria',
        subtitle: 'Digital / Face ID',
        description: 'Toque no sensor biométrico ou use Face ID para entrar'
      });

      // Recupera credenciais salvas no Keystore/Keychain
      const credentials = await NativeBiometric.getCredentials({
        server: this.SERVER_KEY
      });

      if (credentials && credentials.username && credentials.password) {
        return {
          email: credentials.username,
          senha: credentials.password
        };
      }

      return null;
    } catch (e) {
      console.warn('Autenticação biométrica cancelada ou falhou:', e);
      return null;
    }
  }
}
