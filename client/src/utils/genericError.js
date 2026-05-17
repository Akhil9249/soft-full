export const genericError = (error) => {
    
    if (error.response.status === 401) {

        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)

    }else if (error.response.status === 403) {

        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)

    }else if (error.response.status === 404) {

        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)

    }else if (error.response.status === 500) {

        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)

    }else {

        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
    }
}