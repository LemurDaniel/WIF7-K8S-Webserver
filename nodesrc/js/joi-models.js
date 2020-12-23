const joi = require('joi');

schemas = {};
schemas.user_register = joi.object({

    username_display: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z-_\\s]+$'))
        .min(5)
        .max(50)
        .trim()
        .required(),

    username: joi.string()
        .alphanum()
        .min(5)
        .max(50)
        .lowercase()
        .trim()
        .replace(' ', '-')
        .required(),

    password: joi.string()
        .pattern(new RegExp('^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])([a-zA-Z0-9]{7,30})$'))
        .required(),
        /*
            Muss eine Zahl haben: (?=.*[0-9])
            Einen Großbuchstaben: (?=.*[A-Z])
            Einen Kleinbuchstaben: (?=.*[a-z])
            Aplhanumerisch zwischen 7 und 30 Zeichen: ([a-zA-Z0-9]{7,30})$
        */
})

schemas.user_login = joi.object({

    username: joi.string()
        .alphanum()
        .lowercase()
        .trim()
        .replace(' ', '-')
        .required(),

    password: joi.string()
        .required(),
})

schemas.user = joi.object({

    id: joi.number()
        .integer()
        .required(),

    username_display: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z-_\\s]+$'))
        .min(5)
        .max(50)
        .trim()
        .required(),

    iat: joi.number(),
    exp: joi.number()

})

schemas.image = joi.object({

    img_data: joi.string()
        .dataUri()
        .required(),

    img_path: joi.string()
        .min(5)
        .max(100)
        .allow('')
        .lowercase()
        .required(),

    img_name: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z-_\\s]+$'))
        .min(5)
        .max(50)
        .trim()
        .required(),

    user: schemas.user,

    ml5_bestfit: joi.object({
        label: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z-_\\s]+$'))
        .max(20)
        .required(),

        confidence: joi.number()
        .required()
    }),

    ml5: joi.array() 
})

module.exports = schemas;