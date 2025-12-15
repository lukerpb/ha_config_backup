# Home Assistant config backup

This repo exists as a simple cloud backup of my Home Assistant configuration, which controls things such as Sonoff TRVZBs (thermostatic radiator valves communicating over Zigbee). It is also a showcase of what was needed to get things to function in my household, which primarily runs through Apple HomeKit. I have this running as part of a Docker container on a low(ish)-power machine also hosting other services via Docker, but this can equally be used in a bare-metal deployment.

The `configuration.yaml` and `automations.yaml` files are the main stars of the show in this repository, as they form the powerhouse behind what gets exposed to Home Assistant and how they operate. The information below will change as I integrate more fun things into Home Assistant that require custom logic. Use the contents if this list starts getting unwieldy!

## Central heating stuff
This was the main motivator for starting the Home Assistant project. I saw various 'turn-key' ecosystems on the market such as Tado, and nothing offered what I wanted without either sacrificing my requirements for everything working without a network connection (what separates HomeKit from other home control systems), or spending a **_lot_** of money for what is effectively meant to be a thermostically-controlled 'on-off switch' for my radiators. Each room has a [TRV](https://amzn.eu/d/czcVV0M) and a [hygrometer](https://amzn.eu/d/5duFTi0) - the total cost for each room is ~£36-40 depending on when you buy them, cheaper if you buy the devices in bulk and _much_ cheaper than [Tado's latest offering](https://amzn.eu/d/5UFBU1H) as of writing this which still requires the bridge device, and that's before you start adding external temperature sensors and subscriptions.

The contents of the YAML files mentioned do the following:
- allow individual control of each TRVZB device as a 'virtual' thermostat in Apple Home
- read temperature input from ThermoPro TP357 devices located in each room, which
  - acts as the main temperature sensor for the room, alongside humidity which isn't actively used
  - serves as the temperature input for each TRVZB device, seeing as using the internal sensors tends to be unreliable
- allow a 'sync-down' from a generic 'virtual' thermostat for each floor to the TRVZB devices on that floor
  - the temperature reading for the floor is the minimum temperature across all sensors
  - the setpoint reading for the floor is whatever the maximum is across all TRVZB devices
- allow a 'sync-up' from each TRVZB device to the generic 'virtual' thermostat for the floor the device is on
  - mainly for verbosity and to support the second bullet point in the 'sync-down' logic
 
The spare room in the files is excluded from the main floor control and minimum temperature readings, mainly because the room only gets used when a friend is round and the fact the radiator is slightly parasitic to the rest of the ground floor system. It is still able to control the relay controlling the ground floor circuit, but effectively acts as its own 'zone' in comparison to everything else.

### How this might fit into another system
The system here is generally scalable mainly thanks to how literal the YAML files are, but below is a table explaining the 'entity' instances that matter the most. Feel free to alter this to fit the naming convention that works best for your setup, but generally speaking the backend structure controlling them should be kept as-is unless you know what you're doing. This also in part assumes you're using Zigbee valves connected to a **functional Zigbee2MQTT service**, in turn connected to Home Assistant.

| Entity | What it is and/or how it could be adapted |
| --- | --- |
`switch.<zone>_heating` | What the relay switches are exposed as to Home Assistant. The system I have is a homebrew dual-zone controller made 'smart' with the use of an [Aqara T2 relay](https://amzn.eu/d/eyaKo7U) sitting in front of it. These specific relays require a hub to connect, which in turn is exposed as a HomeKit device, but any relay or control interface directly (or indirectly via the 'HomeKit Device' integration, for example) exposing a `switch` entity will work here, with `<zone>` being the group of devices you want to control at once. |
| `climate.<room>_heating` | The 'virtual' thermostats for each floor, created within the configuration acting as proxies for the actual TRVs. Replace `<room>` with the name of the room. |
| `climate.<zone>_heating` | The same as above, but is the thermostat created to control the floor as a whole rather than specific TRVs. |
| `sensor.<room>_<device>_temperature` | The device located in each room that acts as the external temperature sensor. Replace `<room>` with the name of the room and `<device>` with the model name of the device, mainly to prevent confusion if you're using multiple types. |
| `<room>_trv` | The actual TRV device the proxy controls. This should be named within Zigbee2MQTT and have its ID synced from there to Home Assistant. Whilst on that inferface, it's a good idea to tell each TRV inside the 'Exposes' tab to use the external sensor if it is already set up and connected to Home Assistant - you should see the 'Local temperature' value change when you have the right sensor option selected. |
| `input_boolean.heating_<room>` | The 'flag' for each room declaring if the TRV is calling for heat (ON) or not (OFF). The value here doesn't directly control the relays and instead feeds the `input_boolean`s for the floor the room being controlled is on.
| `input_boolean.heating_<zone>` | The combination 'flag' to tell the boiler relay for that zone to turn on if _something_ is calling for heat or turn off if nothing is calling for heat - this essentially acts as an `OR` logic gate for the TRVs on that floor and avoids resource contention between rooms, potentially breaking my boiler with constant switch flickering! |

### Some other useful tidbits
- If you're definitely using Zigbee2MQTT as part of your setup, it's best to leave most of the `topic` MQTT publishes to alone other than the TRV ID (and potentially the end part if the thing you're setting differs to `external_temperature_input`); looking at the 'State' tab for each device should give you an idea of what might be the correct key to publish to.
- Make sure IDs remain unique and unambiguous - this aids not only config maintenance but can in some instances enable GUI control in Home Assistant.
- When exposing climate controls to your home automation system (e.g. HomeKit), make sure Home Assistant is exposing the proxies rather than the TRVs directly. This is mainly down to the TRVs typically also having an 'auto' control, which ignores the carefully-crafted schedules made elsewhere, and stops users accidentally setting it by just offering 'heat' or 'off'.
- Make sure that if you're using TRVs with a 'temperature accuracy' control (or something like it) in the 'Exposes' tab, make sure it matches or slightly exceeds whatever the proxies for each room are set up to, but ideally have both at the smallest value possible.
  - This controls how much the temperature drops by before the TRVs open and let the heat in. If the proxies have a `cold_tolerance` value lower than this (say for example the value is `0.2` but the 'temperature accuracy' is `-1.0`, the boiler would fire up before the valves open, causing a pressure build-up which might damage your pump if you don't have a bypass.
