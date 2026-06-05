vi.mock('../../http');
import { http } from '../../http/index.js';
import { vi, describe, it, expect, afterEach } from 'vitest';
import {
  fetchPublicAppsForPortal,
  fetchPublicAppDeveloperTestAccountInstallData,
  fetchPublicAppProductionInstallCounts,
  fetchPublicAppMetadata,
  installStaticAuthAppOnTestAccount,
  installStaticAuthAppOnCurrentAccount,
  fetchAppMetadataByUid,
  fetchAppMetadataBySourceId,
} from '../appsDev.js';

const APPS_DEV_API_PATH = 'apps-dev/external/public/v3';
const APPS_HUBLETS_API_PATH = 'apps-hublets/external/static-token/v3';

describe('api/appsDev', () => {
  const accountId = 999999;
  const appId = 123456;
  const projectId = 888888;
  const appUid = 'my-app-uid';
  const scopeGroupIds = [1, 2, 3];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPublicAppsForPortal', () => {
    it('should call http.get with the correct url', async () => {
      await fetchPublicAppsForPortal(accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `${APPS_DEV_API_PATH}/full/portal`,
      });
    });
  });

  describe('fetchPublicAppDeveloperTestAccountInstallData', () => {
    it('should call http.get with the correct url', async () => {
      await fetchPublicAppDeveloperTestAccountInstallData(appId, accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `${APPS_DEV_API_PATH}/${appId}/test-portal-installs`,
      });
    });
  });

  describe('fetchPublicAppProductionInstallCounts', () => {
    it('should call http.get with the correct url', async () => {
      await fetchPublicAppProductionInstallCounts(appId, accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `${APPS_DEV_API_PATH}/${appId}/install-counts-without-test-portals`,
      });
    });
  });

  describe('fetchPublicAppMetadata', () => {
    it('should call http.get with the correct url', async () => {
      await fetchPublicAppMetadata(appId, accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `${APPS_DEV_API_PATH}/${appId}/full`,
      });
    });
  });

  describe('installStaticAuthAppOnTestAccount', () => {
    it('should post to the test-account endpoint with the target portal and scopes', async () => {
      await installStaticAuthAppOnTestAccount(appId, accountId, scopeGroupIds);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: APPS_HUBLETS_API_PATH,
        data: {
          appId,
          targetInstallPortalId: accountId,
          scopeGroupIds,
        },
      });
    });
  });

  describe('installStaticAuthAppOnCurrentAccount', () => {
    it('should post to the current-account endpoint with the target portal and scopes', async () => {
      await installStaticAuthAppOnCurrentAccount(
        appId,
        accountId,
        scopeGroupIds
      );
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `${APPS_HUBLETS_API_PATH}/current-account`,
        data: {
          appId,
          targetInstallPortalId: accountId,
          scopeGroupIds,
        },
      });
    });
  });

  describe('fetchAppMetadataByUid', () => {
    it('should call http.get with the source id url and params', async () => {
      await fetchAppMetadataByUid(appUid, accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `${APPS_DEV_API_PATH}/full/portal/sourceId`,
        params: {
          sourceId: appUid,
        },
      });
    });
  });

  describe('fetchAppMetadataBySourceId', () => {
    it('should call http.get with the project id url and source id params', async () => {
      await fetchAppMetadataBySourceId(projectId, appUid, accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `${APPS_DEV_API_PATH}/project-id/${projectId}/source-id/${appUid}`,
        params: {
          sourceId: appUid,
        },
      });
    });
  });
});
