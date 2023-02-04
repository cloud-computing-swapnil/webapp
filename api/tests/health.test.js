import request from "supertest";
import app from "../app.js";


describe('Invalid Endpoint', () => {
    test('404 for invalid route', async() => {
        const res = await request(app).get('/wrong')
        expect(res.statusCode).toEqual(404)
    })
})

describe("GET Health Endpoint", () => {
    test("Check health on /healthz", async () => {
        const res = await request(app).get("/healthz");
        expect(res.statusCode).toEqual(200);
    });
});