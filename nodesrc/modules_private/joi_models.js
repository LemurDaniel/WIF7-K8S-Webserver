const joi = require('joi');

schemas = {};
schemas.user_register = joi.object({

    username_display: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z-_\\s]+$'))
        .min(2)
        .max(50)
        .trim()
        .required(),

    username: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z\-_\.]+$'))
        .min(2)
        .max(50)
        .lowercase()
        .trim()
        .required(),

    password: joi.string()
        //.pattern(new RegExp('^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])([a-zA-Z0-9]{7,30})$'))
        .pattern(new RegExp('^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(.{7,30})$'))
        .required(),
        /*
            Muss eine Zahl haben: (?=.*[0-9])
            Einen Großbuchstaben: (?=.*[A-Z])
            Einen Kleinbuchstaben: (?=.*[a-z])
            Aplhanumerisch zwischen 7 und 30 Zeichen: ([a-zA-Z0-9]{7,30})$
        */
})

schemas.user = joi.object({

    id: joi.string()
        .pattern(new RegExp('^[0-9a-f]{16}$'))
        .required(),

    username_display: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z-_\\s]+$'))
        .min(2)
        .max(50)
        .trim()
        .required(),

    pass: joi.string(),

    iat: joi.number(),
    exp: joi.number()

})

schemas.save_score = joi.object({ 
    
    user: schemas.user,
    score: joi.number()
})

schemas.image = joi.object({

    img_data: joi.string()
        .dataUri()
        .required(),

    img_path: joi.string()
        .pattern(new RegExp('^[0-9a-f]{16}[.]png$'))
        .allow('')
        .lowercase()
        .required(),

    img_name: joi.string()
        .pattern(new RegExp('^[0-9a-zA-Z-_\\s]+$'))
        .min(2)
        .max(50)
        .trim()
        .required(),

    user: schemas.user,

    ml5_bestfit: joi.object({
        label: joi.string()
        .max(25)
        .required(),

        confidence: joi.number()
        .required()
    }),

    ml5: joi.array() 
})

schemas.error = (message) => {
    const err = { code: 0, err: message.details[0].message};
    const label = message.details[0].context.label;

    if(label == 'username_display')
        err.err = 'Displayname only allows alphanumeric Characters including Spaces and - or _';

    if(label == 'username')
        err.err = 'Username only allows alphanumeric Characters including . or - or _';

    if(label == 'password')
        err.err = 'Password must be between 7 and 30 Characters '+
                    'and must include each once: <br>Number, Lowercase and Uppercase Character';

    return err;
}

module.exports = schemas;