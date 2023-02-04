export const setResponse = (obj, status, response)=>{
    response.status(status).send(obj)
    // response.json(obj)
}