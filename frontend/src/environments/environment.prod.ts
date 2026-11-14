import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrlAuth: 'http://localhost:8081/zimbra/v1'
};
