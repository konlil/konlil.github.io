var cubeRotation = 0.0;

main();

function main()
{
	const canvas = document.querySelector('#glcanvas');
	const gl = canvas.getContext('webgl');
	if(!gl){
		alert("Initialize webgl failed. Your browser or machine may not support it.");
		return;
	}

	//ctx = WebGLDebugUtils.makeDebugContext(gl);

	//vertex shader
	const vsSource = `
		attribute vec4 aVertxPos;
		attribute vec2 aTexCoord;

		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;

		varying highp vec2 vTexCoord;

		void main(){
			gl_Position = uProjectionMatrix * uModelViewMatrix * aVertxPos;
			vTexCoord = aTexCoord;
		}
	`;

	//fragment shader
	const fsSource = `
		varying highp vec2 vTexCoord;
		
		uniform sampler2D uSampler;

		void main(){
			gl_FragColor = texture2D(uSampler, vTexCoord);
		}
	`;

	//create a shader program
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

	//collect paramters from shader program
	const programInfo = {
		program: shaderProgram,
		attribs: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "aVertxPos"),
			textureCoord: gl.getAttribLocation(shaderProgram, "aTexCoord"),
		},

		uniforms: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
		},
	};

	//create and fill buffers
	const buffers = initBuffers(gl);

	//load texture
	const texture = loadTexture(gl, "../img/checkboard.png");

	var then = 0;

	//main loop
	function render(now)
	{
		now *= 0.001;
		const deltaTime = now - then;
		then = now;

		//draw scene
		drawScene(gl, programInfo, buffers, texture, deltaTime);

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}


//create and fill buffers
function initBuffers(gl)
{
	//set up positions
	const positions = [
		// Front face
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,

		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,

		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		 1.0,  1.0, -1.0,

		// Bottom face
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,

		// Right face
		 1.0, -1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,

		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0,
	];

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	//set up colors
	const textureCoordinates = [
		// Front
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Back
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Top
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Bottom
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Right
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Left
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
	];
	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

	//set up indices
	const indices = [
		0,  1,  2,      0,  2,  3,    // front
		4,  5,  6,      4,  6,  7,    // back
		8,  9,  10,     8,  10, 11,   // top
		12, 13, 14,     12, 14, 15,   // bottom
		16, 17, 18,     16, 18, 19,   // right
		20, 21, 22,     20, 22, 23,   // left
	];
	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	//return buffer obj
	return { 
		position: positionBuffer,
		textureCoord: texCoordBuffer,
		indices: indexBuffer,
	};
}

//draw scene
function drawScene(gl, programInfo, buffers, texture, deltaTime)
{
	//clear everything
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);  //近处的物体挡住远处的物体

	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	//create projection matrix
	const FOV = 45 * Math.PI / 180.0; // fov in radians
	const Aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix, FOV, Aspect, zNear, zFar); //gl_matrix.js( create a projection matrix )

	//init model view matrix
	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
	mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);  // rotate with axis
	mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0]);  // rotate with axis


	//transport position to gpu
	{
		const numComponents = 3;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position); //bind buffer
		gl.vertexAttribPointer(
			programInfo.attribs.vertexPosition,  //attrib index
			numComponents,
			type,
			normalize,
			stride,
			offset,
		);
		gl.enableVertexAttribArray(programInfo.attribs.vertexPosition);
	}

	//transport tex coord to gpu
	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
		gl.vertexAttribPointer(
			programInfo.attribs.textureCoord,
			numComponents,
			type,
			normalize,
			stride,
			offset
		);
		gl.enableVertexAttribArray(programInfo.attribs.textureCoord);
	}

	//transport indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

	//use shader program
	gl.useProgram(programInfo.program);

	//set uniforms
	gl.uniformMatrix4fv(programInfo.uniforms.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniforms.modelViewMatrix, false, modelViewMatrix);

	//draw call
	{
		const vertexCount = 36;
		const offset = 0;
		const type = gl.UNSIGNED_SHORT;
		gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
	}

	//update rotation
	cubeRotation += deltaTime;
}

function loadTexture(gl, url)
{
	const texture = gl.createTexture();

	//create a dummy texture while the texture not downloaded.
	gl.bindTexture(gl.TEXTURE_2D, texture);
	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]);
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

	//download texture
	const image = new Image();
	image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

		if(isPowerOf2(image.width) && isPowerOf2(image.height))
		{
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		else
		{
			//not power of 2, turn off mips and set wrapping to clamp to edge
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TOEDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TOEDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	};
	image.crossOrigin = "anonymous";
	image.src = url;

	return texture;
}

function isPowerOf2(value)
{
	return (value & (value - 1)) == 0;
}

function initShaderProgram(gl, vsSource, fsSource)
{
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	//create shader program
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);

	//check
	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert('Unable to create shader program: ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}
	return shaderProgram;
}

function loadShader(gl, type, source)
{
	const shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	//check
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		alert('An error occurred when compiling shader: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}