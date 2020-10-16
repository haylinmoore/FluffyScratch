export default async function authNoRef(req, res){
    res.send(
        'If you are seeing this it means the a site tried to use the FluffyScratch Auth but forgot to send it a "redirect" query. Please yell at them and not me'
    );
}