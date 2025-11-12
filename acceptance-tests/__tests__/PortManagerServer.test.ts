import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { PortManagerServer } from '../../utils/PortManagerServer';
import { PORT_MANAGER_SERVER_PORT } from '../../constants/ports';

const BASE_URL = `http://localhost:${PORT_MANAGER_SERVER_PORT}`;
const TEST_INSTANCE_ID = 'test-instance-123';

describe('PortManagerServer Acceptance Tests', () => {
  beforeAll(async () => {
    await PortManagerServer.init();
  });

  afterAll(async () => {
    // Clean up by closing the server
    await axios.post(`${BASE_URL}/close`);
  });

  describe('Health Check', () => {
    it('should respond to health check endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/port-manager-health-check`);

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('OK');
    });
  });

  describe('Server Management', () => {
    it('should get empty servers list initially', async () => {
      const response = await axios.get(`${BASE_URL}/servers`);

      expect(response.status).toBe(200);
      expect(response.data.servers).toEqual({});
      expect(response.data.count).toBe(0);
    });

    it('should assign ports to servers', async () => {
      const portData = [{ instanceId: TEST_INSTANCE_ID, port: 3001 }];

      const response = await axios.post(`${BASE_URL}/servers`, { portData });

      expect(response.status).toBe(200);
      expect(response.data.ports).toHaveProperty(TEST_INSTANCE_ID);
      expect(typeof response.data.ports[TEST_INSTANCE_ID]).toBe('number');
    });

    it('should get servers list with assigned server', async () => {
      const response = await axios.get(`${BASE_URL}/servers`);

      expect(response.status).toBe(200);
      expect(response.data.servers).toHaveProperty(TEST_INSTANCE_ID);
      expect(response.data.count).toBe(1);
    });

    it('should get server port by instance ID', async () => {
      const response = await axios.get(
        `${BASE_URL}/servers/${TEST_INSTANCE_ID}`
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('port');
      expect(typeof response.data.port).toBe('number');
    });

    it('should return 404 for non-existent instance ID', async () => {
      await expect(
        axios.get(`${BASE_URL}/servers/non-existent-id`)
      ).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('should return 409 when trying to assign port to existing instance', async () => {
      const portData = [{ instanceId: TEST_INSTANCE_ID, port: 3002 }];

      await expect(
        axios.post(`${BASE_URL}/servers`, { portData })
      ).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    it('should delete server instance', async () => {
      const response = await axios.delete(
        `${BASE_URL}/servers/${TEST_INSTANCE_ID}`
      );

      expect(response.status).toBe(200);
    });

    it('should return 404 when deleting non-existent instance', async () => {
      await expect(
        axios.delete(`${BASE_URL}/servers/non-existent-id`)
      ).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('should handle invalid port ranges', async () => {
      const portData = [
        { instanceId: 'test-invalid-port', port: 999 }, // Below MIN_PORT_NUMBER (1024)
      ];

      await expect(
        axios.post(`${BASE_URL}/servers`, { portData })
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('should assign multiple ports to different instances', async () => {
      const portData = [
        { instanceId: 'test-instance-1', port: 3001 },
        { instanceId: 'test-instance-2', port: 3002 },
        { instanceId: 'test-instance-3' }, // Auto-assign port
      ];

      const response = await axios.post(`${BASE_URL}/servers`, { portData });

      expect(response.status).toBe(200);
      expect(Object.keys(response.data.ports)).toHaveLength(3);
      expect(response.data.ports).toHaveProperty('test-instance-1');
      expect(response.data.ports).toHaveProperty('test-instance-2');
      expect(response.data.ports).toHaveProperty('test-instance-3');

      // Clean up
      await axios.delete(`${BASE_URL}/servers/test-instance-1`);
      await axios.delete(`${BASE_URL}/servers/test-instance-2`);
      await axios.delete(`${BASE_URL}/servers/test-instance-3`);
    });
  });
});
