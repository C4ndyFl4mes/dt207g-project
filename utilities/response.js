/**
 * En klass för att standardisera responsmeddelanden.
 */
class Response {

    constructor(res, success = false, status = 500, message = 'Response är fel någonstans?') {
        this.res = res;
        this.success = success;
        this.status = status;
        this.message = message;
    }

    send(data = null) {
        if (data) {
            return this.res.status(this.status).json({
                success: this.success,
                message: this.message,
                data: data
            });
        } else {
            return this.res.status(this.status).json({
                success: this.success,
                message: this.message
            });
        }
    }
}

module.exports = Response;