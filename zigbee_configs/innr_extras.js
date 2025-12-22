const m = require('zigbee-herdsman-converters/lib/modernExtend');
const ota = require('zigbee-herdsman-converters/lib/ota');

const definitions = [

    {
        zigbeeModel: ['RB 255 C'],
        model: 'RB 255 C',
        vendor: 'Innr',
        description: 'E14 RGBW Mini',
        ota: ota.zigbeeOTA,
        extend: [
            m.light({
                colorTemp: { range: [153, 556] },
                color: { modes: ['xy', 'hs'], enhancedHue: true }
            })
        ],
    },

    {
        zigbeeModel: ['RS 242 C'],
        model: 'RS 242 C',
        vendor: 'Innr',
        description: 'GU10 RGBW bulb',
        ota: ota.zigbeeOTA,
        extend: [
            m.light({
                colorTemp: { range: [153, 556] },
                color: { modes: ['xy', 'hs'], enhancedHue: true }
            })
        ],
    },

    {
        zigbeeModel: ['RB 252 C'],
        model: 'RB 252 C',
        vendor: 'Innr',
        description: 'E14 RGBW Candle',
        ota: ota.zigbeeOTA,
        extend: [
            m.light({
                colorTemp: { range: [153, 556] },
                color: { modes: ['xy', 'hs'], enhancedHue: true }
            })
        ],
    }
];

module.exports = definitions;
