#include <stdio.h>
#include <stdlib.h>
#include <float.h>
#include <math.h>

typedef struct {
	unsigned char r, g, b;
} RGBu8;

typedef struct {
	int width;
	int height;
	RGBu8 *pixels;
} Image;

typedef struct {
	float x, y;
} Vec2;

static void image_to_ppm6(Image *img, const char *filename) {
	FILE *output = fopen(filename, "wb");
	if(output) {
		fprintf(output, "P6\n%d %d\n255\n", img->width, img->height);
		fwrite(img->pixels, sizeof(img->pixels[0]) * img->width * img->height, 1, output);
		fclose(output);
	}
}

int main(int argc, char *argv[]) {
	// Create a 512x512 canvas
	Image img;
	img.width = 512;
	img.height = 512;
	img.pixels = malloc(sizeof(img.pixels[0]) * img.width * img.height);

	// Create some random points within the boundaries of the canvas
	Vec2 points[128];
	for(int i = 0; i < sizeof(points) / sizeof(points[0]); i++) {
		points[i].x = rand() / (float)RAND_MAX * img.width;
		points[i].y = rand() / (float)RAND_MAX * img.height;
	}

	// Iterate over every pixel on the canvas
	for(int y = 0; y < img.height; y++) {
		for(int x = 0; x < img.width; x++) {
			unsigned char r, g, b;

			int closest_point = -1;
			float smallest_distance = FLT_MAX;
			for(int i = 0; i < sizeof(points) / sizeof(points[0]); i++) {

				float dx = points[i].x - x;
				float dy = points[i].y - y;
				float distance = sqrtf(dx*dx+dy*dy);

				if(distance < smallest_distance) {
					smallest_distance = distance;
					closest_point = i;
				}
			}

			float closest_edge_distance = FLT_MAX;
			for(int i = 0; i < sizeof(points) / sizeof(points[0]); i++) {

				float midpoint_x = (points[closest_point].x + points[i].x) / 2.0f;
				float midpoint_y = (points[closest_point].y + points[i].y) / 2.0f;

				float m_p3_x = x - midpoint_x;
				float m_p3_y = y - midpoint_y;

				float m_p1_x = points[closest_point].x - midpoint_x;
				float m_p1_y = points[closest_point].y - midpoint_y;

				float len_m_p1 = sqrtf(m_p1_x*m_p1_x + m_p1_y*m_p1_y);
				float unit_dx = m_p1_x / len_m_p1;
				float unit_dy = m_p1_y / len_m_p1;

				float proj = m_p3_x * unit_dx + m_p3_y * unit_dy;

				if(proj < closest_edge_distance) {
					closest_edge_distance = proj;
				}
			}

			float color = 0.1 + 0.9 * (closest_edge_distance / 30.0f);
			if(color < 0) color = 0.0f;
			if(color > 1) color = 1.0f;

			r = g = b = color * 255;
			img.pixels[x+y*img.width] = (RGBu8){r, g, b};
		}
	}


	// Write the canvas to a file
	image_to_ppm6(&img, "output.ppm");
	return 0;
}
