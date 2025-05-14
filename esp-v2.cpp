#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

/**************************************
 * PIN DEFINITIONS
 * Defines all analog and digital pins used in the system
 **************************************/
const int acPin = 33;     // A0 - Analog input for AC current sensor
const int heaterPin = 32; // A1 - Analog input for heater current sensor
const int lightsPin = 35; // A2 - Analog input for lights current sensor

const int acRelay = 27;     // Digital output to control AC relay
const int heaterRelay = 26; // Digital output to control heater relay
const int lightsRelay = 25; // Digital output to control lights relay

/**************************************
 * LOAD MANAGEMENT CONFIGURATION
 * Thresholds and variables for the load shedding system
 **************************************/
const float totalThreshold = 7.5;   // Load threshold above which shedding begins
const float restoreThreshold = 3.0; // Load threshold below which restoration begins

float acValue = 0, heaterValue = 0, lightsValue = 0, totalLoad = 0;

/**************************************
 * BLYNK CONFIGURATION
 * Authentication and network credentials
 **************************************/
const char *ssid = "Realme";
const char *password = "omartarek";
#define BLYNK_TEMPLATE_ID "TMPL4T3fOcJc0"
#define BLYNK_TEMPLATE_NAME "final"
#define BLYNK_AUTH_TOKEN "h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb"
#include <BlynkSimpleEsp32.h>

/**************************************
 * LOAD MANAGEMENT ARRAYS
 * Parallel arrays defining device properties for load management
 * Array order determines shedding priority (first device shed first)
 * and restoration priority (last device restored first)
 **************************************/

const int RELAY_PINS[] = {acRelay, heaterRelay, lightsRelay}; // Device arrays (in priority order for shedding)
const char *DEVICE_NAMES[] = {"AC", "Heater", "Lights"};
const char *DEVICE_SHORT_NAMES[] = {"AC (A0)", "Heater(A1)", "Lights(A2)"};
const int NUM_DEVICES = sizeof(RELAY_PINS) / sizeof(RELAY_PINS[0]);

/**************************************
 * BLYNK CONTROL VARIABLES
 * Virtual pin mappings:
 * - V0, V1, V2: Load value monitoring for AC, heater, lights
 * - V3: Mode control (0=automatic load shedding, 1=manual Blynk control)
 * - V4, V5, V6: Manual relay control for AC, heater, lights
 **************************************/
bool blynkMode = false;  // False = automatic load shedding, True = manual Blynk control
bool acState = true;     // True = ON, False = OFF
bool heaterState = true; // True = ON, False = OFF
bool lightsState = true; // True = ON, False = OFF

BlynkTimer timer;
/**************************************
 * BLYNK HANDLERS
 * Functions that respond to control signals from the Blynk app
 **************************************/
BLYNK_WRITE(V3)
{
  blynkMode = param.asInt(); // 1 for Blynk control, 0 for local
  Serial.print("blynk handler: ");
  Serial.print("blynkMode -> ");
  Serial.print(blynkMode);
  Serial.print(", V3 -> ");
  Serial.println(V3);
}

BLYNK_WRITE(V4)
{
  acState = param.asInt();
  digitalWrite(acRelay, acState ? HIGH : LOW);
  Serial.print("blynk handler: ");
  Serial.print("AC Relay -> ");
  Serial.print(V4);
  Serial.print(", acState -> ");
  Serial.print(acState);
  Serial.print(", acRelay pin -> ");
  Serial.println(acRelay);
}

BLYNK_WRITE(V5)
{
  heaterState = param.asInt();
  digitalWrite(heaterRelay, heaterState ? HIGH : LOW);
  Serial.print("blynk handler: ");
  Serial.print("heaterRelay: V5 -> ");
  Serial.print(V5);
  Serial.print(", heaterState -> ");
  Serial.print(heaterState);
  Serial.print(", heaterRelay pin -> ");
  Serial.println(heaterRelay);
}

BLYNK_WRITE(V6)
{
  lightsState = param.asInt();
  digitalWrite(lightsRelay, lightsState ? HIGH : LOW);
  Serial.print("blynk handler: ");
  Serial.print("lightsRelay: V6 -> ");
  Serial.print(V6);
  Serial.print(", lightsState -> ");
  Serial.print(lightsState);
  Serial.print(", lightsRelay pin -> ");
  Serial.println(lightsRelay);
}

/**************************************
 * SETUP FUNCTION
 * Initializes hardware, connections, and defaults
 **************************************/
void setup()
{
  Serial.begin(115200);
  Serial.println("System Initializing...");

  // Configure relay pins as outputs
  pinMode(acRelay, OUTPUT);
  pinMode(heaterRelay, OUTPUT);
  pinMode(lightsRelay, OUTPUT);

  // Set all relays to ON initially
  digitalWrite(acRelay, HIGH);
  digitalWrite(heaterRelay, HIGH);
  digitalWrite(lightsRelay, HIGH);

  // Initialize LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.print("Load Shedding");
  lcd.setCursor(0, 1);
  lcd.print("System Ready");
  delay(2000);
  lcd.clear();

  // Initialize Blynk connection
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, password);

  // Set up timer for sending sensor values
  timer.setInterval(1000L, sendSensorToBlynk);
}

/**************************************
 * MAIN LOOP
 * Primary execution loop that handles:
 * - Blynk connection maintenance
 * - Sensor updates
 * - Display updates
 * - Load management
 **************************************/
void loop()
{
  Blynk.run();
  timer.run();

  // Update load values and calculate total
  totalLoad = updateAndRecalculate();

  // Update display with current load
  lcd.setCursor(0, 0);
  lcd.print("Load: ");
  lcd.print(totalLoad);
  lcd.print("    ");

  // Execute load management logic
  manageLoads();
  delay(200);
}

/**************************************
 * BLYNK COMMUNICATION
 * Sends current sensor values to Blynk app
 **************************************/
void sendSensorToBlynk()
{
  Blynk.virtualWrite(V0, acValue);
  Blynk.virtualWrite(V1, heaterValue);
  Blynk.virtualWrite(V2, lightsValue);
}

/**************************************
 * SENSOR READING AND CALCULATION
 * Reads analog values from sensors and calculates total load
 *
 * @return Total power load from all sensors
 **************************************/
float updateAndRecalculate()
{
  acValue = analogRead(acPin) * (3.3 / 4095.0);
  heaterValue = analogRead(heaterPin) * (3.3 / 4095.0);
  lightsValue = analogRead(lightsPin) * (3.3 / 4095.0);
  return acValue + heaterValue + lightsValue;
}

/**************************************
 * LOAD MANAGEMENT COORDINATOR
 * Main function that coordinates load shedding and restoration
 * based on the current operating mode and load values
 **************************************/
void manageLoads()
{
  updatMotorSpeed();
  if (blynkMode)
  {
    // Skip automatic management if in Blynk manual control mode
    Serial.println("Blynk manual control mode is activated");
    return;
  }

  // First try to shed if overloaded
  if (tryShedNextDevice(totalLoad))
  {
    return;
  }

  // If not overloaded, try to restore
  tryRestoreNextDevice(totalLoad);
}

/**************************************
 * LOAD SHEDDING FUNCTION
 * Attempts to shed the next available device if total load is too high
 *
 * @param totalLoad Current total load value
 * @return True if a device was shed, false otherwise
 **************************************/
bool tryShedNextDevice(float totalLoad)
{
  if (totalLoad <= totalThreshold)
  {
    return false;
  }

  // Try to shed devices in order (from lowest to highest priority)
  for (int i = 0; i < NUM_DEVICES; i++)
  {
    if (digitalRead(RELAY_PINS[i]) == HIGH)
    {
      shedDevice(RELAY_PINS[i], DEVICE_NAMES[i], DEVICE_SHORT_NAMES[i]);
      return true;
    }
  }
  return false;
}

/**************************************
 * LOAD RESTORATION FUNCTION
 * Attempts to restore the next available device if total load is low enough
 *
 * @param totalLoad Current total load value
 * @return True if a device was restored, false otherwise
 **************************************/
bool tryRestoreNextDevice(float totalLoad)
{
  if (totalLoad >= restoreThreshold)
  {
    return false;
  }

  // Try to restore devices in reverse order (from highest to lowest priority)
  for (int i = NUM_DEVICES - 1; i >= 0; i--)
  {
    if (digitalRead(RELAY_PINS[i]) == LOW)
    {
      restoreDevice(RELAY_PINS[i], DEVICE_NAMES[i]);
      return true;
    }
  }
  return false;
}

/**************************************
 * DEVICE SHEDDING HELPER
 * Turns off a specific device and updates displays
 *
 * @param relayPin The pin connected to the device's relay
 * @param name Full name of the device for serial output
 * @param shortName Short name of device for LCD display
 **************************************/
void shedDevice(int relayPin, const char *name, const char *shortName)
{
  digitalWrite(relayPin, LOW);
  lcd.setCursor(0, 1);
  lcd.print("Shed ");
  lcd.print(shortName);
  Serial.print(name);
  Serial.println(" Shedded");
  delay(1000);
  lcd.clear();
}

/**************************************
 * DEVICE RESTORATION HELPER
 * Turns on a specific device and updates displays
 *
 * @param relayPin The pin connected to the device's relay
 * @param name Full name of the device for displays
 **************************************/
void restoreDevice(int relayPin, const char *name)
{
  digitalWrite(relayPin, HIGH);
  lcd.setCursor(0, 1);
  lcd.print("Restore ");
  lcd.print(name);
  Serial.print(name);
  Serial.println(" Restored");
  delay(1000);
  lcd.clear();
}

/**************************************
 * updating fan motor speed
 * change the speed of the motor depending on the voltage reading
 **************************************/
void updatMotorSpeed()
{
  int potValue = analogRead(potPin);             // Range: 0–4095
  int pwmValue = map(potValue, 0, 4095, 0, 255); // Map to 0–255
  analogWrite(enPin, pwmValue);                  // Write PWM to motor
  Serial.printf("Pot: %d → PWM: %d\n", potValue, pwmValue);
}