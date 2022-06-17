window.util = {
    requestHttp: (params) => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        resolve(xhr.response);
                    } else {
                        reject({
                            status: xhr.status,
                            response: xhr.response,
                        });
                    }
                }
            };
            xhr.open(params.method || "GET", params.url, true);

            if (params.headers) {
                for (let key in params.headers) {
                    xhr.setRequestHeader(key, params.headers[key]);
                }
            }

            let data = params.data;
            if (data && typeof data == "object") {
                data = JSON.stringify(data);
            }

            xhr.send(data);
        });
    },

    sleep: () => {
        return new Promise((resolve) => {
            setTimeout(resolve, 10);
        });
    },
};
