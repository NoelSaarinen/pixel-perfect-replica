## What is this?

This is a hardware research and data visualization project. It visually demonstrates the critical difference between standard rigid optical sensors (PPG) and **Viscoelastic Optical Coupling** when measuring heart rate during physical movement.

The goal of this project is to highlight the mechanical bottlenecks in smart ring accuracy, specifically how motion artifacts, air gaps, and grip pressure disrupt the optical signal and cause data loss during exercise.

## How to Use the Application

1. **Load Sensor Data**: Upload raw PPG sensor data from the testing environment into the main dashboard. The app automatically sanitizes and formats the signal noise.
2. **Check Baseline Signal**: Notice the baseline heart rate and Signal-to-Noise Ratio (SNR) at the top of the screen, calculated instantly based on the resting state data.
3. **Enable Motion Simulation**: Turn on "Motion Artifacts". Notice how the standard rigid sensor signal drops out drastically as the algorithm struggles to filter out mechanical vibration and ambient light leaks.
4. **Test Viscous Coupling**: Activate the viscoelastic gel simulation. The application will automatically calculate how the soft optical bridge maintains signal integrity line-by-line, keeping the sensor coupled to the skin so the light path is never broken.
5. **Compare Output**: Activate the comparative graph mode. The application will read the dual sensor data and automatically synchronize the standard PPG visual with the stabilized viscoelastic model.
```eof
